import path from 'node:path';
import {
  fs,
  type Alias,
  getAliasConfig,
  isDepExists,
  loadFromProject,
  mergeAlias,
  readTsConfigByFile,
  readTsConfigWithExtends,
  resolveServerTsconfigInfo,
  warnServerTsconfigOverrides,
} from '@modern-js/utils';
import type { ConfigChain } from '@rsbuild/core';

type TsRuntimeRegisterMode = 'ts-node' | 'node-loader' | 'unsupported';

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

// Compiler options that only matter for a full program / emit, or whose
// relative paths are resolved against the declaring config file. They are
// dropped when the merged options are handed to ts-node without a project.
const TS_NODE_IGNORED_OPTIONS = new Set([
  'baseUrl',
  'paths',
  'rootDir',
  'rootDirs',
  'outDir',
  'outFile',
  'declarationDir',
  'typeRoots',
  'tsBuildInfoFile',
  'composite',
  'incremental',
  'noEmit',
  'emitDeclarationOnly',
  'declaration',
  'declarationMap',
  'sourceMap',
  'inlineSourceMap',
  'inlineSources',
  'mapRoot',
  'sourceRoot',
]);

export const createTsNodeCompilerOptions = (
  compilerOptions: Record<string, unknown>,
  ...overrides: Array<Record<string, unknown> | undefined>
) => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(compilerOptions)) {
    if (!TS_NODE_IGNORED_OPTIONS.has(key)) {
      result[key] = value;
    }
  }
  return Object.assign(result, ...overrides);
};

// ts-node 10.x resolves `extends` itself and only understands a string. The
// recommended `tsconfig.server.json` keeps `extends` a string, but a chain
// that does contain an array (for example `@modern-js/tsconfig/server` used
// as a second entry) cannot be passed to ts-node as `project`; it is merged
// here instead as a defensive fallback.
export const canTsNodeReadProject = (files: string[]) =>
  files.every(file => !Array.isArray(readTsConfigByFile(file)?.extends));

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
  const tsconfigInfo = resolveServerTsconfigInfo(appDir, options.tsconfigPath, {
    moduleType:
      options.moduleType === 'module' || options.moduleType === 'commonjs'
        ? options.moduleType
        : undefined,
  });
  const tsconfigPath = tsconfigInfo.path;
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
    const tsConfig = readTsConfigWithExtends(tsconfigPath);
    const tsNodeOptions = tsConfig.raw['ts-node'];
    const tsNodeProject = canTsNodeReadProject(tsConfig.files);
    // A bundler-mode `tsconfig.json` (`module: ESNext`) in a commonjs project
    // has to be transpiled as NodeNext or `require()` fails on the output.
    // ts-node `compilerOptions` overrides the project file; the user's own
    // `ts-node.compilerOptions` still wins over the framework defaults. When
    // ts-node cannot read the project itself, the whole merged option set is
    // passed instead.
    const tsNodeCompilerOptions = tsNodeProject
      ? { ...tsconfigInfo.compilerOverrides, ...tsNodeOptions?.compilerOptions }
      : createTsNodeCompilerOptions(
          tsConfig.compilerOptions,
          tsconfigInfo.compilerOverrides,
          tsNodeOptions?.compilerOptions,
        );

    if (options.moduleType === 'module') {
      const { registerModuleHooks } = await import('../esm/register-esm.mjs');
      await registerModuleHooks({
        appDir,
        distDir,
        baseUrl: absoluteBaseUrl || './',
        paths: runtimePaths,
        tsconfigPath: tsNodeProject ? tsconfigPath : undefined,
        compilerOptions: tsNodeCompilerOptions,
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
    const tsNode = await loadFromProject('ts-node', appDir);
    warnServerTsconfigOverrides(tsconfigPath, tsconfigInfo.compilerOverrides);
    tsNode.register({
      ...(tsNodeProject
        ? { project: tsconfigPath }
        : { skipProject: true, scopeDir: appDir }),
      scope: true,
      // for env.d.ts, https://www.npmjs.com/package/ts-node#missing-types
      files: true,
      transpileOnly: true,
      ignore: [
        '(?:^|/)node_modules/',
        `(?:^|/)${path.relative(appDir, distDir)}/`,
      ],
      ...tsNodeOptions,
      ...(Object.keys(tsNodeCompilerOptions).length > 0
        ? { compilerOptions: tsNodeCompilerOptions }
        : {}),
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
