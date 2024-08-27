import { loadConfig } from '@modern-js/core';
import {
  type UniBuilderInstance,
  createUniBuilder,
} from '@modern-js/uni-builder';
import { type RsbuildConfig, mergeRsbuildConfig } from '@rsbuild/core';
import type { Options } from '@storybook/types';
import { addonBabelAdapter, pluginStorybook } from './plugin-storybook';
import type { BuilderConfig, BuilderOptions } from './types';
import { getConfigFileName, runWithErrorMsg } from './utils';

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

  uniBuilderConfig.source ??= {};
  uniBuilderConfig.source.entry = {
    main: entries,
  };

  const bundlerType = bundler || 'webpack';

  const builder = await createUniBuilder({
    bundlerType,
    cwd,
    frameworkConfigPath: res?.path ? res.path : undefined,
    config:
      bundlerType === 'webpack'
        ? await addonBabelAdapter(uniBuilderConfig, options)
        : uniBuilderConfig,
  });

  builder.addPlugins([
    pluginStorybook(cwd, options),
    ...(finalConfig.builderPlugins || []),
  ]);

  return builder;
}
