import Module from 'node:module';
import path from 'node:path';
import { fs, getAliasConfig, readTsConfigWithExtends } from '@modern-js/utils';
import { register as registerPaths } from '@modern-js/utils/tsconfig-paths';
import { transformSync } from '@swc/core';
import { createSwcOptions } from '../compilers/swc';

type CompilerOptions = Record<string, any>;

interface SwcRegisterOptions {
  distDir: string;
  compilerOptions?: CompilerOptions;
  /**
   * `package.json#type` of the app. In a `module` app, `require()` of a
   * `.ts` file fails with `ERR_REQUIRE_ESM`, as it does with ts-node and
   * Node itself, so scanners that try `require()` first fall back to
   * `import()` and load the one ES module instance.
   */
  moduleType?: 'module' | 'commonjs';
}

type ExtensionHandler = (module: NodeJS.Module, filename: string) => void;

const TS_EXTENSIONS = ['.ts', '.tsx', '.cts'];

// Only the first call installs the require hooks; later calls (e.g. a dev
// restart in the same process) just swap the options they read.
let currentOptions: SwcRegisterOptions | undefined;

/**
 * `compilerOptions` of a tsconfig file with its `extends` chain applied, so
 * options like `experimentalDecorators` from a shared base are respected.
 */
export const readCompilerOptions = (tsconfigPath: string): CompilerOptions =>
  readTsConfigWithExtends(tsconfigPath).compilerOptions;

// NodeNext-style sources import `./user.js` for `./user.ts`; like ts-node,
// fall back to the TypeScript file when the JavaScript one does not exist.
const TS_FOR_JS: Record<string, string[]> = {
  '.js': ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
  '.mjs': ['.mts'],
  '.cjs': ['.cts'],
};

export const getTypeScriptCandidates = (request: string): string[] => {
  if (!request.startsWith('./') && !request.startsWith('../')) {
    return [];
  }
  const ext = path.extname(request);
  return (TS_FOR_JS[ext] ?? []).map(
    tsExt => request.slice(0, -ext.length) + tsExt,
  );
};

const isIgnored = (filename: string, distDir: string) => {
  if (filename.split(path.sep).includes('node_modules')) {
    return true;
  }
  const relativeToDist = path.relative(distDir, filename);
  return !relativeToDist.startsWith('..') && !path.isAbsolute(relativeToDist);
};

/**
 * Compile `.ts` files to CommonJS with swc through CJS require hooks.
 *
 * Unlike Node.js native type stripping, the compiled modules live in
 * `require.cache`, so the dev server can reload them by deleting cache
 * entries, and syntax that needs transforming (enum, decorators, parameter
 * properties, etc.) keeps working.
 */
export const registerSwc = (options: SwcRegisterOptions) => {
  const shouldInstall = !currentOptions;
  currentOptions = options;
  if (!shouldInstall) {
    return;
  }

  // The compiled code moves lines around (e.g. rewritten imports), so map
  // error stack traces back to the source through the inline source maps.
  process.setSourceMapsEnabled(true);

  const extensions = (Module as any)._extensions as Record<
    string,
    ExtensionHandler
  >;

  const moduleWithResolve = Module as unknown as {
    _resolveFilename: (
      request: string,
      parent?: NodeJS.Module,
      ...rest: unknown[]
    ) => string;
  };
  const originalResolveFilename = moduleWithResolve._resolveFilename;
  moduleWithResolve._resolveFilename = function (request, parent, ...rest) {
    try {
      return originalResolveFilename.call(this, request, parent, ...rest);
    } catch (error) {
      const candidates = getTypeScriptCandidates(request);
      if (
        (error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND' ||
        candidates.length === 0 ||
        !parent?.filename ||
        isIgnored(parent.filename, currentOptions!.distDir)
      ) {
        throw error;
      }
      for (const candidate of candidates) {
        try {
          return originalResolveFilename.call(this, candidate, parent, ...rest);
        } catch {}
      }
      throw error;
    }
  };

  for (const ext of TS_EXTENSIONS) {
    const originalHandler = extensions[ext];
    extensions[ext] = (module, filename) => {
      const { distDir, compilerOptions = {}, moduleType } = currentOptions!;
      if (isIgnored(filename, distDir)) {
        (originalHandler || extensions['.js'])(module, filename);
        return;
      }
      if (moduleType === 'module' && ext !== '.cts') {
        const error: NodeJS.ErrnoException = new Error(
          `require() of ES Module ${filename} not supported.`,
        );
        error.code = 'ERR_REQUIRE_ESM';
        throw error;
      }
      const source = fs.readFileSync(filename, 'utf-8');
      const { code } = transformSync(source, {
        ...createSwcOptions(filename, compilerOptions, 'commonjs'),
        sourceMaps: 'inline',
      });
      (module as any)._compile(code, filename);
    };
  }
};

export interface ServerRuntimeOptions {
  appDirectory: string;
  distDirectory: string;
  /** The server tsconfig, as resolved by `resolveServerTsconfigInfo`. */
  tsconfigPath: string;
}

/**
 * Run the server code of an app from source in the current process: tsconfig
 * `paths` aliases, swc require hooks, and the `require` preloads of the
 * tsconfig `"ts-node"` section, which keeps working without ts-node.
 */
export const registerServerRuntime = ({
  appDirectory,
  distDirectory,
  tsconfigPath,
}: ServerRuntimeOptions) => {
  const { raw, compilerOptions } = readTsConfigWithExtends(tsconfigPath);
  const tsNodeOptions = raw['ts-node'] ?? {};

  const { paths = {}, absoluteBaseUrl = './' } = getAliasConfig(
    {},
    {
      appDirectory,
      tsconfigPath,
    },
  );
  // `source.alias` entries are not part of this config, so every value is
  // the array form tsconfig `paths` uses.
  const tsconfigPaths: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(paths)) {
    tsconfigPaths[key] = ([] as string[]).concat(value);
  }
  if (Object.keys(tsconfigPaths).length > 0) {
    registerPaths({ baseUrl: absoluteBaseUrl, paths: tsconfigPaths });
  }

  registerSwc({
    distDir: distDirectory,
    compilerOptions: { ...compilerOptions, ...tsNodeOptions.compilerOptions },
  });

  const appRequire = Module.createRequire(
    path.join(appDirectory, 'package.json'),
  );
  const preloads: string[] = [].concat(tsNodeOptions.require ?? []);
  for (const request of preloads) {
    appRequire(request);
  }
};
