import type { PluginAPI } from '@modern-js/core';
import type { ModuleContext } from '../types/context';
import type {
  BuildCommandOptions,
  BaseBuildConfig,
  ModuleToolsHooks,
} from '../types';

export const run = async (
  options: {
    cmdOptions: BuildCommandOptions;
    resolvedBuildConfig: BaseBuildConfig[];
    context: ModuleContext;
  },
  api: PluginAPI<ModuleToolsHooks>,
) => {
  const { chalk } = await import('@modern-js/utils');
  const { resolvedBuildConfig, context, cmdOptions } = options;
  const runner = api.useHookRunners();

  if (resolvedBuildConfig.length !== 0) {
    const { buildSuccessText } = await import('../constants/log');
    // eslint-disable-next-line no-console
    !cmdOptions.watch && console.time(buildSuccessText);

    const { runBuildTask } = await import('./build');
    const { default: pMap } = await import('../../compiled/p-map');

    const { clearBuildConfigPaths, clearDtsTemp } = await import('./clear');
    await clearBuildConfigPaths(resolvedBuildConfig);
    await clearDtsTemp();

    const { getStyleConfig } = await import('../utils/style');
    const styleConfig = await getStyleConfig(api);

    if (cmdOptions.watch) {
      console.info(chalk.blue.underline('start build in watch mode...\n'));
    }

    try {
      await pMap(resolvedBuildConfig, async config => {
        await runner.beforeBuildTask({ config, options: cmdOptions });
        await runBuildTask(
          {
            buildConfig: config,
            buildCmdOptions: cmdOptions,
            context,
            styleConfig,
          },
          api,
        );
        await runner.afterBuildTask({ status: 'success', config });
      });
      // eslint-disable-next-line no-console
      !cmdOptions.watch && console.timeEnd(buildSuccessText);
    } catch (e) {
      const { isInternalError, ModuleBuildError } = await import('../error');
      if (isInternalError(e)) {
        throw new ModuleBuildError(e);
      } else {
        throw e;
      }
    }
  } else {
    console.warn(
      chalk.yellow(
        `No build configuration found! Please configure \`buildConfig\` or \`buildPreset\``,
      ),
    );
  }

  await runner.afterBuild({ status: 'success', config: resolvedBuildConfig });
};
