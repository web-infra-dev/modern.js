import path from 'node:path';
import {
  fs,
  type Alias,
  getAliasConfig,
  loadFromProject,
  readTsConfigByFile,
  tryResolve,
} from '@modern-js/utils';
import type { ConfigChain } from '@rsbuild/core';

const checkDepExist = (dep: string, appDir: string) => {
  try {
    tryResolve(dep, appDir, process.cwd());
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if Node.js has native TypeScript support (Node 22.6+ with strip-types).
 */
const hasNativeTypeScript = (): boolean => {
  return Boolean((process as any).features?.typescript);
};

/**
 * Compute tsconfig paths in a format suitable for alias resolution.
 */
const computeTsPaths = (
  paths: Record<string, string | string[]>,
  absoluteBaseUrl: string,
) => {
  return Object.keys(paths).reduce(
    (o, key) => {
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
    },
    {} as Record<string, string[]>,
  );
};

/**
 * Setup TypeScript runtime support.
 * Register ts-node for compilation and tsconfig-paths for path alias resolution.
 * On Node 22+ with native TypeScript support, falls back to alias-only resolution
 * when ts-node is not available.
 */
export const setupTsRuntime = async (
  appDir: string,
  distDir: string,
  alias?: ConfigChain<Alias>,
) => {
  const TS_CONFIG_FILENAME = `tsconfig.json`;
  const tsconfigPath = path.resolve(appDir, TS_CONFIG_FILENAME);
  const isTsProject = await fs.pathExists(tsconfigPath);

  if (!isTsProject) {
    return;
  }

  const hasTsNode = checkDepExist('ts-node', appDir);

  const aliasConfig = getAliasConfig(alias, {
    appDirectory: appDir,
    tsconfigPath,
  });
  const { paths = {}, absoluteBaseUrl = './' } = aliasConfig;
  const tsPaths = computeTsPaths(paths, absoluteBaseUrl);

  if (hasTsNode) {
    // ts-node available: use ts-node for compilation + tsconfig-paths for aliases
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

    const { register } = await import('@modern-js/utils/tsconfig-paths');
    register({
      baseUrl: absoluteBaseUrl || './',
      paths: tsPaths,
    });
  } else if (hasNativeTypeScript()) {
    // Node 22+ with native TypeScript support but no ts-node:
    // Register ESM resolve hooks for tsconfig path aliases and extensionless imports.
    // Node handles TypeScript compilation natively via strip-types.
    const { registerAliasResolver } = await import(
      '../esm/register-esm.mjs' as string
    );
    await registerAliasResolver({
      absoluteBaseUrl,
      paths: tsPaths,
    });
  }
};
