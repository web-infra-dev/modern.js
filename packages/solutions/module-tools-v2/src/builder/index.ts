import type { PluginAPI } from '@modern-js/core';
import type {
  BuildCommandOptions,
  BaseBuildConfig,
  ModuleToolsHooks,
} from '../types';

export const run = async (
  options: BuildCommandOptions,
  resolvedBuildConfig: BaseBuildConfig[],
  api: PluginAPI<ModuleToolsHooks>,
) => {
  if (options.platform) {
    const { buildPlatform } = await import('./platform');
    await buildPlatform(options, api);
    return;
  }

  if (resolvedBuildConfig.length === 0) {
    return;
  }

  const { default: pMap } = await import('p-map');
  const runner = api.useHookRunners();
  await pMap(resolvedBuildConfig, async config => {
    await runner.beforeBuildTask({ config, options });
    console.info('run build', JSON.stringify(config));
    await runner.afterBuildTask({ status: 'success', config });
  });

  await runner.afterBuild({ status: 'success', config: resolvedBuildConfig });
};
