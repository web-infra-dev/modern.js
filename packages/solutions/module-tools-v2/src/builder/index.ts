import type { PluginAPI } from '@modern-js/core';
import type { ModuleContext } from '../types/context';
import type {
  BuildCommandOptions,
  BaseBuildConfig,
  ModuleToolsHooks,
} from '../types';

export const run = async (
  options: BuildCommandOptions,
  resolvedBuildConfig: BaseBuildConfig[],
  api: PluginAPI<ModuleToolsHooks>,
  context: ModuleContext,
) => {
  if (options.platform) {
    const { buildPlatform } = await import('./platform');
    await buildPlatform(options, api, context);
    return;
  }

  const runner = api.useHookRunners();

  if (resolvedBuildConfig.length !== 0) {
    const { default: pMap } = await import('p-map');
    await pMap(resolvedBuildConfig, async config => {
      await runner.beforeBuildTask({ config, options });
      console.info('run build', JSON.stringify(config));
      await runner.afterBuildTask({ status: 'success', config });
    });
  }

  await runner.afterBuild({ status: 'success', config: resolvedBuildConfig });
};
