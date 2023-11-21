import os from 'os';
import type { PluginAPI } from '@modern-js/core';
import { chalk, logger } from '@modern-js/utils';
import type { ModuleContext } from '../types/context';
import type {
  BuildCommandOptions,
  BaseBuildConfig,
  ModuleTools,
} from '../types';
import pMap from '../../compiled/p-map';
import { debug } from '../debug';
import { runBuildTask } from './build';
import { clearBuildConfigPaths, clearDtsTemp } from './clear';

export const run = async (
  options: {
    cmdOptions: BuildCommandOptions;
    normalizedBuildConfig: BaseBuildConfig[];
    context: ModuleContext;
  },
  api: PluginAPI<ModuleTools>,
) => {
  const { normalizedBuildConfig, context, cmdOptions } = options;
  const { watch, clear } = cmdOptions;
  const runner = api.useHookRunners();

  let totalDuration = 0;

  if (normalizedBuildConfig.length !== 0) {
    totalDuration = Date.now();

    if (clear) {
      debug('clear output paths');
      await clearBuildConfigPaths(normalizedBuildConfig, context.appDirectory);
      debug('clear output paths done');
    }
    await clearDtsTemp();

    if (watch) {
      logger.info('Start build in watch mode...');
    }

    try {
      await pMap(
        normalizedBuildConfig,
        async config => {
          debug('run beforeBuildTask hooks');
          const buildConfig = await runner.beforeBuildTask(config);
          debug('run beforeBuildTask hooks done');
          await runBuildTask(
            {
              buildConfig,
              buildCmdOptions: cmdOptions,
              context,
            },
            api,
          );
          debug('run afterBuildTask hooks');
          await runner.afterBuildTask({ status: 'success', config });
          debug('run afterBuildTask hooks done');
        },
        { concurrency: os.cpus().length },
      );
    } catch (e) {
      const { isInternalError, ModuleBuildError } = await import('../error');
      if (isInternalError(e)) {
        throw new ModuleBuildError(e);
      } else {
        throw e;
      }
    }
    totalDuration = Date.now() - totalDuration;
    if (!watch) {
      const { printFileSize, printSucceed } = await import('../utils/print');
      printSucceed(totalDuration);
      printFileSize();
    }
  } else {
    logger.warn(
      chalk.yellow(
        `No build configuration found! Please configure \`buildConfig\` or \`buildPreset\``,
      ),
    );
  }
  debug('run afterBuild hooks');

  await runner.afterBuild({
    status: 'success',
    config: normalizedBuildConfig,
    commandOptions: cmdOptions,
    totalDuration,
  });
  debug('run afterBuild hooks done');
};
