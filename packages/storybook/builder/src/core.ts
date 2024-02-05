import { createUniBuilder, UniBuilderConfig } from '@modern-js/uni-builder';
import { mergeRsbuildConfig, RsbuildConfig } from '@rsbuild/shared';
import { loadConfig } from '@modern-js/core';
import type { Options } from '@storybook/types';
import type { Compiler } from '@rsbuild/shared/webpack-dev-middleware';
import type { BuilderOptions } from './types';
import { getConfigFileName, runWithErrorMsg } from './utils';
import { pluginStorybook, addonBabelAdapter } from './plugin-storybook';

export async function getCompiler(
  cwd: string,
  builderOptions: BuilderOptions,
  options: Options,
): Promise<Compiler> {
  const { bundler } = builderOptions;

  const { presets } = options;

  const entries = await presets.apply<string[]>('entries', []);

  const res = await runWithErrorMsg(
    () => loadConfig(cwd, builderOptions.configPath || getConfigFileName()),
    'Failed to load config',
  );
  const loadedConfig = (res ? res.config : {}) as UniBuilderConfig;

  const finalConfig =
    (await presets.apply<UniBuilderConfig | void>('modern', loadedConfig)) ||
    loadedConfig;

  const uniBuilderConfig = (
    builderOptions.builderConfig
      ? mergeRsbuildConfig(
          finalConfig as RsbuildConfig,
          builderOptions.builderConfig,
        )
      : finalConfig || {}
  ) as UniBuilderConfig;

  const bundlerType = bundler || 'webpack';

  const builder = await createUniBuilder({
    bundlerType,
    cwd,
    target: 'web',
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
    // TODO
    // @ts-expect-error
    ...(finalConfig.builderPlugins || []),
  ]);

  return builder.createCompiler();
}
