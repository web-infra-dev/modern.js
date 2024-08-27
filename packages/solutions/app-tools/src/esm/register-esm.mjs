import path from 'node:path';
import { fs, readTsConfigByFile, isVersionAtLeast1819 } from '@modern-js/utils';
import assert from 'node:assert';

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
    process.env.MODERN_NODE_LOADER = 'esbuild';
    let tsConfig = {};
    if (hasTsconfig) {
      tsConfig = readTsConfigByFile(tsconfigPath);
    }
    const esbuildRegister = await import('esbuild-register/dist/node');
    esbuildRegister.register({
      tsconfigRaw: hasTsconfig ? tsConfig : undefined,
      hookIgnoreNodeModules: true,
      hookMatcher: fileName => !fileName.startsWith(distDir),
    });
    register('./esbuild-loader.mjs', import.meta.url, {
      data: {
        appDir,
        distDir,
        alias,
        tsconfigPath,
      },
    });
  }
};
