import path from 'node:path';
import {
  fs,
  type Alias,
  getAliasConfig,
  isDepExists,
  loadFromProject,
  mergeAlias,
  readTsConfigByFile,
} from '@modern-js/utils';
import type { ConfigChain } from '@rsbuild/core';

type TsRuntimeRegisterMode = 'ts-node' | 'node-loader' | 'unsupported';

interface TsRuntimeSetupOptions {
  moduleType?: string;
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

// Describes final runtime selection policy.
// Prefer ts-node when available, otherwise use Node.js native TypeScript support.
export const resolveTsRuntimeRegisterMode = (
  hasTsNode: boolean,
): TsRuntimeRegisterMode => {
  if (hasTsNode) {
    return 'ts-node';
  }

  const hasNativeTypeScriptSupport = (process as any).features?.typescript;
  const nodeMajorVersion = Number(process.versions.node.split('.')[0]);
  const supportsNativeTypeScript =
    hasNativeTypeScriptSupport === undefined
      ? nodeMajorVersion >= 22
      : hasNativeTypeScriptSupport !== false;

  if (supportsNativeTypeScript) {
    return 'node-loader';
  }

  return 'unsupported';
};

/**
 * Setup TypeScript runtime support.
 * Register ts-node for compilation and tsconfig-paths for path alias resolution.
 */
export const setupTsRuntime = async (
  appDir: string,
  distDir: string,
  alias?: ConfigChain<Alias>,
  options: TsRuntimeSetupOptions = {},
) => {
  const TS_CONFIG_FILENAME = `tsconfig.json`;
  const tsconfigPath = path.resolve(appDir, TS_CONFIG_FILENAME);
  const isTsProject = await fs.pathExists(tsconfigPath);
  const hasTsNode = isDepExists(appDir, 'ts-node');

  if (!isTsProject) {
    return;
  }

  const registerMode = resolveTsRuntimeRegisterMode(hasTsNode);

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

  if (registerMode === 'unsupported') {
    return;
  }

  if (registerMode === 'ts-node') {
    if (options.moduleType === 'module') {
      const { registerModuleHooks } = await import('../esm/register-esm.mjs');
      await registerModuleHooks({
        appDir,
        distDir,
        baseUrl: absoluteBaseUrl || './',
        paths: runtimePaths,
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
    const tsConfig = readTsConfigByFile(tsconfigPath);
    const tsNode = await loadFromProject('ts-node', appDir);
    const tsNodeOptions = tsConfig['ts-node'];
    tsNode.register({
      project: tsconfigPath,
      scope: true,
      // for env.d.ts, https://www.npmjs.com/package/ts-node#missing-types
      files: true,
      transpileOnly: true,
      ignore: [
        '(?:^|/)node_modules/',
        `(?:^|/)${path.relative(appDir, distDir)}/`,
      ],
      ...tsNodeOptions,
    });
  } else if (registerMode === 'node-loader') {
    const { registerPathsLoader } = await import('../esm/register-esm.mjs');
    await registerPathsLoader({
      appDir,
      baseUrl: absoluteBaseUrl || './',
      paths: runtimePaths,
    });
  }
};
