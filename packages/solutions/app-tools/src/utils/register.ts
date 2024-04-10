import path from 'node:path';
import {
  Alias,
  fs,
  getAliasConfig,
  readTsConfigByFile,
} from '@modern-js/utils';
import { ChainedConfig } from '@rsbuild/shared';

export const registerCompiler = async (
  appDir: string = process.cwd(),
  distDir: string,
  alias?: ChainedConfig<Alias>,
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

  let tsNode = null;
  try {
    tsNode = await import('ts-node');
  } catch (error) {}

  if (isTsProject && tsNode) {
    const tsConfig = readTsConfigByFile(tsconfigPath);
    const tsNodeOptions = tsConfig['ts-node'];
    tsNode.register({
      project: tsconfigPath,
      scope: true,
      // for env.d.ts, https://www.npmjs.com/package/ts-node#missing-types
      files: true,
      transpileOnly: true,
      ignore: ['(?:^|/)node_modules/', `(?:^|/)${distDir}/`],
      ...tsNodeOptions,
    });
  } else {
    const esbuildRegister = await import('esbuild-register/dist/node');
    if (isTsProject) {
      const tsConfig = readTsConfigByFile(tsconfigPath);
      esbuildRegister.register({
        tsconfigRaw: tsConfig,
        hookIgnoreNodeModules: true,
        hookMatcher(fileName) {
          if (fileName.startsWith(distDir)) {
            return false;
          }
          return true;
        },
      });
    } else {
      esbuildRegister.register();
    }
  }

  const tsConfigPaths = await import('@modern-js/utils/tsconfig-paths');
  const loaderRes = tsConfigPaths.loadConfig(appDir);
  if (loaderRes.resultType === 'success') {
    tsConfigPaths.register({
      baseUrl: absoluteBaseUrl || './',
      paths: tsPaths,
    });
  }
};
