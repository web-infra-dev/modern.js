import path from 'node:path';
import {
  fs,
  type Alias,
  getAliasConfig,
  loadFromProject,
  logger,
  readTsConfigByFile,
} from '@modern-js/utils';
import type { ConfigChain } from '@rsbuild/core';

const registerEsbuild = async ({
  isTsProject,
  tsConfig,
  distDir,
}: {
  isTsProject: boolean;
  tsConfig: Record<string, any>;
  distDir: string;
}) => {
  const esbuildRegister = await import('esbuild-register/dist/node');
  esbuildRegister.register({
    tsconfigRaw: isTsProject ? tsConfig : undefined,
    hookIgnoreNodeModules: true,
    hookMatcher: fileName => !fileName.startsWith(distDir),
  });
};

export const registerCompiler = async (
  appDir: string,
  distDir: string,
  alias?: ConfigChain<Alias>,
) => {
  const TS_CONFIG_FILENAME = `tsconfig.json`;
  const tsconfigPath = path.resolve(appDir, TS_CONFIG_FILENAME);
  const isTsProject = await fs.pathExists(tsconfigPath);
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

  let tsConfig: Record<string, any> = {};
  if (isTsProject) {
    tsConfig = readTsConfigByFile(tsconfigPath);
  }

  const { MODERN_NODE_LOADER } = process.env;
  if (MODERN_NODE_LOADER === 'esbuild' || !isTsProject) {
    if (process.env.MODERN_LIB_FORMAT !== 'esm') {
      await registerEsbuild({
        isTsProject,
        tsConfig,
        distDir,
      });
    }
  } else {
    try {
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
    } catch (error) {
      if (process.env.DEBUG) {
        logger.error(error);
      }
      await registerEsbuild({
        isTsProject,
        tsConfig,
        distDir,
      });
    }
  }

  const { register } = await import('@modern-js/utils/tsconfig-paths');
  if (await fs.pathExists(appDir)) {
    register({
      baseUrl: absoluteBaseUrl || './',
      paths: tsPaths,
    });
  }
};
