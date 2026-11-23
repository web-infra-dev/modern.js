import { createRequire } from 'node:module';
import path from 'node:path';
import { registerSwc } from '@modern-js/server-utils';
import {
  fs,
  type Alias,
  getAliasConfig,
  mergeAlias,
  readTsConfigWithExtends,
  resolveServerTsconfigInfo,
} from '@modern-js/utils';
import type { ConfigChain } from '@rsbuild/core';

interface TsRuntimeSetupOptions {
  moduleType?: string;
  /**
   * User-configured `server.tsconfigPath`. Forwarded into the shared
   * resolveServerTsconfigInfo helper. Resolved relative to appDir when not
   * absolute. Falls back to `<appDir>/tsconfig.server.json` (convention) and
   * then `<appDir>/tsconfig.json` when unset.
   */
  tsconfigPath?: string;
}

const normalizePathValue = ({
  key,
  value,
  absoluteBaseUrl,
}: {
  key: string;
  value: string;
  absoluteBaseUrl: string;
}) => {
  let normalizedValue = value;

  // Modern.js still has some internal aliases that point at packages instead
  // of source files, so resolve them before handing paths to the runtime.
  if (key.startsWith('@') && normalizedValue.startsWith('@')) {
    try {
      normalizedValue = require.resolve(normalizedValue, {
        paths: [process.cwd(), ...module.paths],
      });
    } catch {}
  }

  return path.isAbsolute(normalizedValue)
    ? path.relative(absoluteBaseUrl, normalizedValue)
    : normalizedValue;
};

const normalizePathValues = ({
  key,
  value,
  absoluteBaseUrl,
}: {
  key: string;
  value: string | string[];
  absoluteBaseUrl: string;
}) => {
  const values = Array.isArray(value) ? value : [value];

  return values.map(item =>
    normalizePathValue({
      key,
      value: item,
      absoluteBaseUrl,
    }),
  );
};

const addResolvedAlias = (
  paths: Record<string, string[]>,
  key: string,
  values: string[],
) => {
  if (!key || paths[key]) {
    return;
  }

  paths[key] = values;
};

const createRuntimePaths = ({
  alias,
  paths,
  absoluteBaseUrl,
}: {
  alias?: ConfigChain<Alias>;
  paths: Record<string, string | string[]>;
  absoluteBaseUrl: string;
}) => {
  const mergedAlias = mergeAlias(alias);
  const normalizedPaths = Object.keys(paths).reduce(
    (result, key) => {
      addResolvedAlias(
        result,
        key.endsWith('$') ? key.slice(0, -1) : key,
        normalizePathValues({
          key,
          value: paths[key],
          absoluteBaseUrl,
        }),
      );

      return result;
    },
    {} as Record<string, string[]>,
  );

  Object.keys(mergedAlias).forEach(key => {
    if (key.includes('*') || key.endsWith('$')) {
      return;
    }

    // Expand `@service` into `@service/*` so runtime loaders can resolve
    // nested imports like `@service/user` with the same rules as tsconfig paths.
    addResolvedAlias(
      normalizedPaths,
      `${key}/*`,
      normalizePathValues({
        key,
        value: mergedAlias[key],
        absoluteBaseUrl,
      }).map(value => `${value}/*`),
    );
  });

  return normalizedPaths;
};

/**
 * Setup TypeScript runtime support for server code at dev time (and for the
 * server config loaded at build time): tsconfig `paths` aliases plus swc
 * hooks — require hooks for CommonJS projects, module hooks for
 * `type: module` ones. TypeScript itself is not loaded, so this works with
 * any TypeScript version, including 7.
 */
export const setupTsRuntime = async (
  appDir: string,
  distDir: string,
  alias?: ConfigChain<Alias>,
  options: TsRuntimeSetupOptions = {},
) => {
  const tsconfigInfo = resolveServerTsconfigInfo(appDir, options.tsconfigPath, {
    moduleType:
      options.moduleType === 'module' || options.moduleType === 'commonjs'
        ? options.moduleType
        : undefined,
  });
  const tsconfigPath = tsconfigInfo.path;
  if (!(await fs.pathExists(tsconfigPath))) {
    return;
  }

  const aliasConfig = getAliasConfig(alias, {
    appDirectory: appDir,
    tsconfigPath,
  });
  const { paths = {}, absoluteBaseUrl = './' } = aliasConfig;
  const runtimePaths = createRuntimePaths({
    alias,
    paths,
    absoluteBaseUrl,
  });

  // The tsconfig `"ts-node"` section keeps working without ts-node: its
  // `compilerOptions` win over the project file and `require` is preloaded.
  const { raw, compilerOptions } = readTsConfigWithExtends(tsconfigPath);
  const tsNodeOptions = raw['ts-node'] ?? {};
  const swcCompilerOptions = {
    ...compilerOptions,
    ...tsNodeOptions.compilerOptions,
  };

  if (options.moduleType === 'module') {
    const { registerSwcModuleHooks } = await import('../esm/register-esm.mjs');
    await registerSwcModuleHooks({
      appDir,
      distDir,
      baseUrl: absoluteBaseUrl || './',
      paths: runtimePaths,
      compilerOptions: swcCompilerOptions,
    });
  } else {
    const { register } = await import('@modern-js/utils/tsconfig-paths');
    register({
      baseUrl: absoluteBaseUrl || './',
      paths: runtimePaths,
    });
  }

  // Keep CJS require hooks in module projects:
  // some server scanners still do `require('*.ts')` first and only
  // fallback to `import()` on ERR_REQUIRE_ESM.
  registerSwc({
    distDir,
    compilerOptions: swcCompilerOptions,
    moduleType: options.moduleType === 'module' ? 'module' : 'commonjs',
  });

  const appRequire = createRequire(path.join(appDir, 'package.json'));
  const preloads: string[] = [].concat(tsNodeOptions.require ?? []);
  for (const request of preloads) {
    appRequire(request);
  }
};
