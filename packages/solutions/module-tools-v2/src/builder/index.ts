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
  const { resolvedBuildConfig, context, cmdOptions } = options;
  const runner = api.useHookRunners();

  if (resolvedBuildConfig.length !== 0) {
    const { runBuildTask } = await import('./build');
    const { default: pMap } = await import('p-map');
    const { fs } = await import('@modern-js/utils');

    for (const config of resolvedBuildConfig) {
      fs.removeSync(config.path);
    }

    const { getSourceConfig } = await import('../utils/source');
    const sourceConfig = await getSourceConfig(api, context);

    const { getStyleConfig } = await import('../utils/style');
    const styleConfig = await getStyleConfig(api);

    await pMap(resolvedBuildConfig, async config => {
      // implementation of `copy` start
      // end

      await runner.beforeBuildTask({ config, options: cmdOptions });
      await runBuildTask(
        {
          buildConfig: config,
          sourceConfig,
          buildCmdOptions: cmdOptions,
          context,
          styleConfig,
        },
        api,
      );
      await runner.afterBuildTask({ status: 'success', config });
    });
  }

  await runner.afterBuild({ status: 'success', config: resolvedBuildConfig });
};
