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
import { runBuildTask } from './build';
import { clearBuildConfigPaths, clearDtsTemp } from './clear';

export const run = async (
  options: {
    cmdOptions: BuildCommandOptions;
    resolvedBuildConfig: BaseBuildConfig[];
    context: ModuleContext;
  },
  api: PluginAPI<ModuleTools>,
) => {
  const { resolvedBuildConfig, context, cmdOptions } = options;
  const { watch, clear } = cmdOptions;
  const runner = api.useHookRunners();

  let totalDuration = 0;

  if (resolvedBuildConfig.length !== 0) {
    totalDuration = Date.now();

    await clearBuildConfigPaths(resolvedBuildConfig, {
      noClear: !clear,
      projectAbsRootPath: context.appDirectory,
    });
    await clearDtsTemp();

    if (watch) {
      logger.info('Start build in watch mode...\n');
    }

    try {
      await pMap(
        resolvedBuildConfig,
        async config => {
          const buildConfig = await runner.beforeBuildTask(config);

          await runBuildTask(
            {
              buildConfig,
              buildCmdOptions: cmdOptions,
              context,
            },
            api,
          );
          await runner.afterBuildTask({ status: 'success', config });
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

  await runner.afterBuild({
    status: 'success',
    config: resolvedBuildConfig,
    commandOptions: cmdOptions,
    totalDuration,
  });
};
