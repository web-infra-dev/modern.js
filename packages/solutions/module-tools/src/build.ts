import type { PluginAPI } from '@modern-js/core';
import { createDebugger } from '@modern-js/utils';
import type { ModuleTools, ModuleContext, BuildCommandOptions } from './types';

const debug = createDebugger('module-tools');

export const build = async (
  api: PluginAPI<ModuleTools>,
  options: BuildCommandOptions,
  context: ModuleContext,
) => {
  if (options.platform) {
    const { buildPlatform } = await import('./builder/platform');
    await buildPlatform(options, api, context);
    return;
  }

  const runner = api.useHookRunners();

  const { normalizeBuildConfig } = await import('./config/normalize');
  const resolvedBuildConfig = await normalizeBuildConfig(api, context, options);

  debug('resolvedBuildConfig', resolvedBuildConfig);

  await runner.beforeBuild({
    config: resolvedBuildConfig,
    cliOptions: options,
  });
  const builder = await import('./builder');
  await builder.run({ cmdOptions: options, resolvedBuildConfig, context }, api);
};
