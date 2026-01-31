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
 * Setup TypeScript runtime support.
 * Register ts-node for compilation and tsconfig-paths for path alias resolution.
 */
export const setupTsRuntime = async (
  appDir: string,
  distDir: string,
  alias?: ConfigChain<Alias>,
) => {
  const TS_CONFIG_FILENAME = `tsconfig.json`;
  const tsconfigPath = path.resolve(appDir, TS_CONFIG_FILENAME);
  const isTsProject = await fs.pathExists(tsconfigPath);
  const hasTsNode = checkDepExist('ts-node', appDir);

  if (!isTsProject || !hasTsNode) {
    return;
  }

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
};
