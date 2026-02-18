import path from 'path';
import vm from 'vm';
import type { BundleLoaderStrategy } from '@modern-js/server-core/node';
import fs from 'fs-extra';

const ASYNC_NODE_STARTUP_CALL =
  'var __webpack_exports__ = __webpack_require__.x();';

const isPromiseLike = (value: unknown): value is Promise<unknown> =>
  Boolean(value) &&
  (typeof value === 'object' || typeof value === 'function') &&
  'then' in (value as Promise<unknown>) &&
  typeof (value as Promise<unknown>).then === 'function';

/**
 * MF async-node startup loader strategy.
 * Handles bundles built with Module Federation experiments.asyncStartup
 * that use __webpack_require__.mfAsyncStartup for deferred initialization.
 * Patches the async startup call to run synchronously when the default
 * require path returns a resolved promise with undefined.
 */
export const mfAsyncStartupLoaderStrategy: BundleLoaderStrategy = async (
  filepath,
  context,
): Promise<unknown | undefined> => {
  try {
    const bundleCode = await fs.readFile(filepath, 'utf-8');

    if (
      !bundleCode.includes(ASYNC_NODE_STARTUP_CALL) ||
      !bundleCode.includes('__webpack_require__.mfAsyncStartup')
    ) {
      return undefined;
    }

    const patchedCode = bundleCode.replace(
      ASYNC_NODE_STARTUP_CALL,
      'var __webpack_exports__ = __webpack_require__.x({}, []);',
    );

    const localModule: { exports: unknown } = { exports: {} };
    const wrapped = `(function(exports, require, module, __filename, __dirname){${patchedCode}\n})`;
    const runBundle = vm.runInThisContext(wrapped, { filename: filepath }) as (
      exports: unknown,
      require: NodeJS.Require,
      module: { exports: unknown },
      __filename: string,
      __dirname: string,
    ) => void;

    runBundle(
      localModule.exports,
      require,
      localModule,
      filepath,
      path.dirname(filepath),
    );

    if (isPromiseLike(localModule.exports)) {
      return await localModule.exports;
    }

    return localModule.exports;
  } catch (error) {
    context?.monitors?.error(
      '[MF] Load async startup bundle strategy failed, error = %s',
      error instanceof Error ? error.stack || error.message : error,
    );
    return undefined;
  }
};
