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

  debug('merge build config');

  const { mergeBuildConfig, normalizeBuildConfig } = await import(
    './config/normalize'
  );
  const mergedConfig = await mergeBuildConfig(api);

  debug('merge build config done');

  debug('mergedConfig', mergedConfig);

  debug('run beforeBuild hooks');

  await runner.beforeBuild({
    config: mergedConfig,
    cliOptions: options,
  });

  debug('run beforeBuild hooks done');

  debug('normalize build config');

  const resolvedBuildConfig = await normalizeBuildConfig(
    mergedConfig,
    context,
    options,
  );

  debug('normalize build config done');

  debug('normalizedBuildConfig', resolvedBuildConfig);

  const builder = await import('./builder');
  await builder.run({ cmdOptions: options, resolvedBuildConfig, context }, api);
};
