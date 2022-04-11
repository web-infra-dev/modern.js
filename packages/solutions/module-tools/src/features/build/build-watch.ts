import * as path from 'path';
import * as os from 'os';
import { execa, Import } from '@modern-js/utils';

import type { NormalizedConfig, PluginAPI } from '@modern-js/core';
import type { IBuildConfig, ITaskMapper } from '../../types';

const lg: typeof import('./logger') = Import.lazy('./logger', require);
const pMap: typeof import('p-map') = Import.lazy('p-map', require);
const utils: typeof import('./utils') = Import.lazy('./utils', require);
const constants: typeof import('./constants') = Import.lazy(
  './constants',
  require,
);

export const buildInWatchMode = async (
  api: PluginAPI,
  config: IBuildConfig,
  _: NormalizedConfig,
) => {
  const { appDirectory } = api.useAppContext();
  const { sourceDir, enableTscCompiler } = config;
  const srcRootDir = path.join(appDirectory, sourceDir);
  const concurrency = os.cpus().length;
  const lm = new lg.LoggerManager();
  const codeLog = lm.createLoggerText({
    title: constants.runBabelCompilerTitle,
  });
  const dtsLog = lm.createLoggerText({ title: constants.runTscWatchTitle });
  const styleLog = lm.createLoggerText({
    title: constants.runStyleCompilerTitle,
  });
  const copyLog = lm.createLoggerText({ title: 'Copy Log:' });
  const initCodeMapper = utils.getCodeInitMapper(api, config);
  const taskMapper: ITaskMapper[] = [
    ...utils.getCodeMapper(api, {
      logger: codeLog,
      taskPath: require.resolve('../../tasks/build-watch-source-code'),
      config,
      willCompilerDirOrFile: sourceDir,
      initMapper: initCodeMapper,
      srcRootDir,
    }),
    ...(enableTscCompiler ? utils.getDtsMapper(api, config, dtsLog) : []),
    {
      logger: styleLog,
      taskPath: require.resolve('../../tasks/build-watch-style'),
    },
    {
      logger: copyLog,
      taskPath: require.resolve('../../tasks/copy-assets'),
      params: ['--watch'],
    },
  ];
  lm.on('data', () => {
    console.info(constants.clearFlag);
    enableTscCompiler && console.info(dtsLog.value);
    console.info(codeLog.value);
    console.info(styleLog.value);
  });
  await pMap(
    taskMapper,
    async ({ logger, taskPath, params }) => {
      const childProcess = execa.node(taskPath, params, { stdio: 'pipe' });
      if (logger === codeLog) {
        lm.addStdout(logger, childProcess.stdout, {
          event: { error: true, data: true },
          // colors: { data: s => s },
        });
        lm.addStderr(logger, childProcess.stderr);
      }

      if (logger === dtsLog) {
        lm.addStdout(logger, childProcess.stdout, {
          event: { data: true, error: true },
          colors: {
            // tsc 的log信息无论是错误还是正确都是从 data event 中获取到的
            data: s => s,
          },
        });
      }

      if (logger === styleLog || logger === copyLog) {
        lm.addStdout(logger, childProcess.stdout, {
          event: { error: true, data: true },
          // colors: { data: s => s },
        });
        lm.addStderr(logger, childProcess.stderr);
      }

      await childProcess;
    },
    { concurrency },
  );
};
