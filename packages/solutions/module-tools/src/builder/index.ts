import type { PluginAPI } from '@modern-js/core';
import { logger } from '@modern-js/utils/logger';
import type { ModuleContext } from '../types/context';
import type {
  BuildCommandOptions,
  BaseBuildConfig,
  ModuleTools,
} from '../types';

export const run = async (
  options: {
    cmdOptions: BuildCommandOptions;
    resolvedBuildConfig: BaseBuildConfig[];
    context: ModuleContext;
  },
  api: PluginAPI<ModuleTools>,
) => {
  const { chalk } = await import('@modern-js/utils');
  const { resolvedBuildConfig, context, cmdOptions } = options;
  const runner = api.useHookRunners();

  let totalDuration = 0;

  if (resolvedBuildConfig.length !== 0) {
    totalDuration = Date.now();

    const { runBuildTask } = await import('./build');
    const { default: pMap } = await import('../../compiled/p-map');

    const { clearBuildConfigPaths, clearDtsTemp } = await import('./clear');
    await clearBuildConfigPaths(resolvedBuildConfig, {
      noClear: !cmdOptions.clear,
      projectAbsRootPath: context.appDirectory,
    });
    await clearDtsTemp();

    if (cmdOptions.watch) {
      logger.info('Start build in watch mode...\n');
    }

    try {
      await pMap(resolvedBuildConfig, async config => {
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
      });
    } catch (e) {
      const { isInternalError, ModuleBuildError } = await import('../error');
      if (isInternalError(e)) {
        throw new ModuleBuildError(e);
      } else {
        throw e;
      }
    }
    totalDuration = Date.now() - totalDuration;
    if (!cmdOptions.watch) {
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
