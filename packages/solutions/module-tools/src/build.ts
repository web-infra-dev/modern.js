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

  const resolvedConfig = await runner.resolveModuleUserConfig(
    api.useConfigContext(),
  );

  debug('resolvedConfig', resolvedConfig);

  debug('normalize build config');

  const { normalizeBuildConfig } = await import('./config/normalize');
  const normalizedBuildConfig = await normalizeBuildConfig(
    resolvedConfig,
    context,
    options,
  );

  debug('normalize build config done');

  debug('normalizedBuildConfig', normalizedBuildConfig);

  debug('run beforeBuild hooks');

  await runner.beforeBuild({
    config: normalizedBuildConfig,
    cliOptions: options,
  });

  debug('run beforeBuild hooks done');

  const builder = await import('./builder');
  await builder.run(
    { cmdOptions: options, normalizedBuildConfig, context },
    api,
  );
};
