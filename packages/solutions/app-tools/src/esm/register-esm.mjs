import assert from 'node:assert';
import path from 'node:path';
import { fs, isVersionAtLeast1819, readTsConfigByFile } from '@modern-js/utils';

const checkDep = async dep => {
  try {
    await import(dep);
    return true;
  } catch (error) {
    return false;
  }
};

export const registerEsm = async ({ appDir, distDir, alias }) => {
  const nodeVersion = process.versions.node;
  const versionArr = nodeVersion.split('.').map(Number);

  assert(
    isVersionAtLeast1819(nodeVersion),
    `The node version of the esm project must be greater than 18.19.0, current version is ${nodeVersion}`,
  );
  const hasTsNode = await checkDep('ts-node');
  const TS_CONFIG_FILENAME = `tsconfig.json`;
  const tsconfigPath = path.resolve(appDir, TS_CONFIG_FILENAME);
  const hasTsconfig = await fs.pathExists(tsconfigPath);
  const { register } = await import('node:module');
  if (hasTsNode && hasTsconfig) {
    // These can be overridden by ts-node options in tsconfig.json
    process.env.TS_NODE_TRANSPILE_ONLY = true;
    process.env.TS_NODE_PROJECT = tsconfigPath;
    process.env.TS_NODE_SCOPE = true;
    process.env.TS_NODE_FILES = true;
    process.env.TS_NODE_IGNORE = `(?:^|/)node_modules/,(?:^|/)${path.relative(
      appDir,
      distDir,
    )}/`;
    register('./ts-node-loader.mjs', import.meta.url, {
      data: {
        appDir,
        distDir,
        alias,
        tsconfigPath,
      },
    });
  } else {
    if (process.env.MODERN_LIB_FORMAT !== 'esm') {
      process.env.MODERN_NODE_LOADER = 'esbuild';
      let tsConfig = {};
      if (hasTsconfig) {
        tsConfig = readTsConfigByFile(tsconfigPath);
      }
      register('./esbuild-loader.mjs', import.meta.url, {
        data: {
          appDir,
          distDir,
          alias,
          tsconfigPath,
        },
      });
    }
  }
};
