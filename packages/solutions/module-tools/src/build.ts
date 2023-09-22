import type { PluginAPI } from '@modern-js/core';
import { debug } from './debug';
import type { ModuleTools, ModuleContext, BuildCommandOptions } from './types';

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

  debug('normalize build config');

  const { normalizeBuildConfig } = await import('./config/normalize');
  const resolvedBuildConfig = await normalizeBuildConfig(api, context, options);

  debug('normalize build config done');

  debug('normalizedBuildConfig', resolvedBuildConfig);

  debug('run beforeBuild hooks');

  await runner.beforeBuild({
    config: resolvedBuildConfig,
    cliOptions: options,
  });

  debug('run beforeBuild hooks done');

  const builder = await import('./builder');
  await builder.run({ cmdOptions: options, resolvedBuildConfig, context }, api);
};
