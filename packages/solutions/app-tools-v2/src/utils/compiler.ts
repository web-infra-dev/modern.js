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

  let tsConfig: Record<string, any> = {};
  if (isTsProject) {
    tsConfig = readTsConfigByFile(tsconfigPath);
  }

  try {
    const tsNode = await import('ts-node');
    const tsNodeOptions = tsConfig['ts-node'];
    if (isTsProject) {
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
    }
  } catch (error) {
    const esbuildRegister = await import('esbuild-register/dist/node');
    esbuildRegister.register({
      tsconfigRaw: isTsProject ? tsConfig : undefined,
      hookIgnoreNodeModules: true,
      hookMatcher: fileName => !fileName.startsWith(distDir),
    });
  }

  const tsConfigPaths = await import('@modern-js/utils/tsconfig-paths');
  if (await fs.pathExists(appDir)) {
    const loaderRes = tsConfigPaths.loadConfig(appDir);
    if (loaderRes.resultType === 'success') {
      tsConfigPaths.register({
        baseUrl: absoluteBaseUrl || './',
        paths: tsPaths,
      });
    }
  }
};
