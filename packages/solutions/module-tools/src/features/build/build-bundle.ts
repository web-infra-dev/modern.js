import * as os from 'os';
import { execa, Import } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type { TaskBuildConfig, ITaskMapper } from '../../types';

const pMap: typeof import('p-map') = Import.lazy('p-map', require);
const utils: typeof import('./utils') = Import.lazy('./utils', require);
const lg: typeof import('./logger') = Import.lazy('./logger', require);
const constants: typeof import('./constants') = Import.lazy(
  './constants',
  require,
);

export const buildInBundleMode = async (
  api: PluginAPI,
  config: TaskBuildConfig,
) => {
  const { enableTscCompiler } = config;
  const concurrency = os.cpus().length;
  const lm = new lg.LoggerManager();
  const bundleLog = lm.createLoggerText({
    title: constants.runBundlerTitle,
  });
  const rollupLog = lm.createLoggerText({
    title: constants.runDtsBundlerTitle,
  });

  const taskMapper: ITaskMapper[] = [
    ...utils.getBundlerMapper(api, config, bundleLog),
  ];
  if (enableTscCompiler) {
    taskMapper.push(...utils.getRollupMapper(api, config, rollupLog));
  }
  lm.on('data', () => {
    console.info(constants.clearFlag);
    enableTscCompiler && console.info(rollupLog.value);
    console.info(bundleLog.value);
  });

  await pMap(
    taskMapper,
    async ({ logger, taskPath, params }) => {
      const childProcess = execa.node(taskPath, params, { stdio: 'pipe' });

      if (logger === bundleLog || logger === rollupLog) {
        lm.addStdout(logger, childProcess.stdout, {
          event: { data: true, error: true },
        });
        lm.addStderr(logger, childProcess.stderr);
      }
      await childProcess;
    },
    { concurrency },
  );

  if (rollupLog.hasErrorMessage || bundleLog.hasErrorMessage) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
};
