import path from 'node:path';
import {
  fs,
  type Alias,
  getAliasConfig,
  isDepExists,
  loadFromProject,
  readTsConfigByFile,
} from '@modern-js/utils';
import type { ConfigChain } from '@rsbuild/core';

type TsRuntimeRegisterMode = 'ts-node' | 'node-loader' | 'unsupported';

interface TsRuntimeSetupOptions {
  moduleType?: string;
  preferTsNodeForServerRuntime?: boolean;
}

// Describes final runtime selection policy.
// Prefer Node.js native TypeScript support when available, otherwise fall back to ts-node; skip setup when neither exists.
export const resolveTsRuntimeRegisterMode = (
  hasTsNode: boolean,
): TsRuntimeRegisterMode => {
  const hasNativeTypeScriptSupport = (process as any).features?.typescript;
  const nodeMajorVersion = Number(process.versions.node.split('.')[0]);
  const supportsNativeTypeScript =
    hasNativeTypeScriptSupport === undefined
      ? nodeMajorVersion >= 22
      : hasNativeTypeScriptSupport !== false;

  if (supportsNativeTypeScript) {
    return 'node-loader';
  }

  if (hasTsNode) {
    return 'ts-node';
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

  const tsPaths = Object.keys(paths).reduce((o, key) => {
    let tsPath = paths[key];
    // Do some special handling for Modern.js's internal alias, we can drop it in the next version
    if (
      typeof tsPath === 'string' &&
      key.startsWith('@') &&
      tsPath.startsWith('@')
    ) {
      try {
        tsPath = require.resolve(tsPath, {
          paths: [process.cwd(), ...module.paths],
        });
      } catch {}
    }
    if (typeof tsPath === 'string' && path.isAbsolute(tsPath)) {
      tsPath = path.relative(absoluteBaseUrl, tsPath);
    }
    if (typeof tsPath === 'string') {
      tsPath = [tsPath];
    }
    return {
      ...o,
      [`${key}`]: tsPath,
    };
  }, {});

  if (registerMode === 'unsupported') {
    return;
  }

  if (registerMode === 'ts-node') {
    if (options.moduleType === 'module') {
      const { registerModuleHooks } = await import('../esm/register-esm.mjs');
      await registerModuleHooks({
        appDir,
        distDir,
        alias: alias || {},
      });
    }

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
      paths: tsPaths,
    });
  }

  const { register } = await import('@modern-js/utils/tsconfig-paths');
  register({
    baseUrl: absoluteBaseUrl || './',
    paths: tsPaths,
  });
};
