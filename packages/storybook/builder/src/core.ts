import { createBuilder, mergeBuilderConfig } from '@modern-js/builder';
import { loadConfig } from '@modern-js/core';
import type { Options } from '@storybook/types';
import type { Compiler } from 'webpack-dev-middleware';
import { BuilderConfig, FrameworkOptions } from './types';
import { getProvider, runWithErrorMsg } from './utils';
import { pluginStorybook } from './plugin-storybook';

export async function getCompiler(
  cwd: string,
  frameworkConfig: FrameworkOptions,
  options: Options,
): Promise<Compiler> {
  const bundler = frameworkConfig.bundler || 'webpack';

  const { presets } = options;
  const entries = await presets.apply<string[]>('entries', []);
  const otherBuilderConfig =
    (await presets.apply<BuilderConfig | void>('modern')) || {};

  const res = await runWithErrorMsg(
    () => loadConfig(cwd, frameworkConfig.configPath || 'modern.config.ts'),
    'Failed to load config',
  );

  const loadedConfig = (res ? res.config : {}) as BuilderConfig;
  const builderConfig = mergeBuilderConfig(otherBuilderConfig, loadedConfig);

  const provider = await getProvider(bundler, builderConfig);

  if (!provider) {
    throw new Error(`@modern-js/builder-${bundler}-provider not found `);
  }

  const builder = await createBuilder(provider, {
    cwd,
    target: 'web',
    framework: 'modern.js storybook',
    entry: {
      main: entries,
    },
  });

  builder.addPlugins([
    pluginStorybook(cwd, options),
    ...(loadedConfig.builderPlugins || []),
  ]);

  return builder.createCompiler() as Promise<Compiler>;
}
