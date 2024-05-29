import { createUniBuilder, UniBuilderInstance } from '@modern-js/uni-builder';
import { mergeRsbuildConfig, type RsbuildConfig } from '@rsbuild/core';
import { loadConfig } from '@modern-js/core';
import type { Options } from '@storybook/types';
import type { BuilderOptions, BuilderConfig } from './types';
import { getConfigFileName, runWithErrorMsg } from './utils';
import { pluginStorybook, addonBabelAdapter } from './plugin-storybook';

export async function createBuilder(
  cwd: string,
  builderOptions: BuilderOptions,
  options: Options,
): Promise<UniBuilderInstance> {
  const { bundler } = builderOptions;

  const { presets } = options;

  const entries = await presets.apply<string[]>('entries', []);

  const res = await runWithErrorMsg(
    () => loadConfig(cwd, builderOptions.configPath || getConfigFileName()),
    'Failed to load config',
  );
  const loadedConfig = (res ? res.config : {}) as BuilderConfig;

  const finalConfig =
    (await presets.apply<BuilderConfig | void>('modern', loadedConfig)) ||
    loadedConfig;

  const uniBuilderConfig = builderOptions.builderConfig
    ? (mergeRsbuildConfig(
        finalConfig as RsbuildConfig,
        builderOptions.builderConfig as RsbuildConfig,
      ) as BuilderConfig)
    : finalConfig || {};

  const bundlerType = bundler || 'webpack';

  const builder = await createUniBuilder({
    bundlerType,
    cwd,
    target: 'web',
    frameworkConfigPath: res?.path ? res.path : undefined,
    config:
      bundlerType === 'webpack'
        ? await addonBabelAdapter(uniBuilderConfig, options)
        : uniBuilderConfig,
    entry: {
      main: entries,
    },
  });

  builder.addPlugins([
    pluginStorybook(cwd, options),
    ...(finalConfig.builderPlugins || []),
  ]);

  return builder;
}
