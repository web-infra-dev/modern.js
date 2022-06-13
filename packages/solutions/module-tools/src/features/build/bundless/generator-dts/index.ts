import path from 'path';
import type { ChildProcess } from 'child_process';
import { Import, execa, fs, json5, isObject } from '@modern-js/utils';
import type { NormalizedConfig, PluginAPI } from '@modern-js/core';
import type { NormalizedBundlelessBuildConfig } from '../../types';
import type { ITsconfig } from '../../../../types';
import { getTscBinPath, IGeneratorConfig } from './utils';

const utils: typeof import('./utils') = Import.lazy('./utils', require);

const getProjectTsconfig = (tsconfigPath: string | undefined): ITsconfig => {
  if (!tsconfigPath || !fs.existsSync(tsconfigPath)) {
    return {};
  }

  return json5.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
};

const resolveLog = (
  childProgress: ChildProcess,
  { tsCheck = false, watch = false } = {},
) => {
  /**
   * tsc 所有的log信息都是从stdout data 事件中获取
   * 正常模式下，如果有报错信息，交给 resolveLog 后面的逻辑来处理
   * watch 模式下，则使用这里的信息
   */
  childProgress.stdout?.on('data', data => {
    if (!tsCheck) {
      return;
    }
    if (watch) {
      console.info(data.toString());
    }
  });
  // 正常以下内容都不会触发，因为tsc 不会产生以下类型的log信息，不过防止意外情况
  childProgress.stdout?.on('error', error => {
    console.error(error.message);
  });
  childProgress.stderr?.on('data', chunk => {
    console.error(chunk.toString());
  });
};

const generatorDts = async (_: NormalizedConfig, config: IGeneratorConfig) => {
  const {
    tsconfigPath,
    distDir,
    sourceDir = 'src',
    appDirectory,
    tsCheck = false,
    watch = false,
  } = config;

  const userTsconfig = getProjectTsconfig(tsconfigPath);
  const willDeleteTsconfigPath = utils.generatorTsConfig(userTsconfig, {
    appDirectory,
    distDir,
    sourceDir,
  });
  const tscBinFile = getTscBinPath(appDirectory);

  const watchParams = watch ? ['-w'] : [];
  const childProgress = execa(
    tscBinFile,
    ['-p', willDeleteTsconfigPath, ...watchParams],
    {
      stdio: 'pipe',
      cwd: appDirectory,
    },
  );
  resolveLog(childProgress, { tsCheck, watch });
  try {
    await childProgress;
    console.info('[TSC Compiler]: Successfully');
  } catch (e) {
    if (!tsCheck) {
      console.info(
        `There are some type warnings, which can be checked by configuring 'output.disableTsChecker = false'`,
      );
    }
    // 通过使用 execa，可以将 tsc 的 data 类型的报错信息变为异常错误信息
    else if (isObject(e) && e.stdout) {
      console.error(e.stdout);
    } else {
      console.error(e);
    }
  }
  fs.removeSync(willDeleteTsconfigPath);
};

export const genDts = async (
  api: PluginAPI,
  config: NormalizedBundlelessBuildConfig,
) => {
  const {
    outputPath,
    tsconfig: tsconfigPath,
    watch,
    bundlelessOptions: { sourceDir },
    outputStylePath,
  } = config;
  const { appDirectory } = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const {
    output: { path: distPath = 'dist' },
  } = modernConfig;
  // Compatible Logic
  const distDir = outputStylePath
    ? path.join(appDirectory, distPath, 'types')
    : path.join(appDirectory, distPath, outputPath, 'types');

  const option = {
    appDirectory,
    distDir,
    tsconfigPath,
    watch,
    tsCheck: true,
    sourceDir,
  };
  await generatorDts(modernConfig, option);
  // TODO: watch 模式下无法转换
  utils.resolveAlias(modernConfig, option);
};
