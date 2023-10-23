import { createBuilder } from '@modern-js/builder';
import { loadConfig } from '@modern-js/core';
import type { Options } from '@storybook/types';
import type { Compiler } from '@modern-js/builder-shared/webpack-dev-middleware';
import type { BuilderConfig, BuilderOptions } from './types';
import { getConfigFileName, getProvider, runWithErrorMsg } from './utils';
import { pluginStorybook } from './plugin-storybook';

export async function getCompiler(
  cwd: string,
  builderOptions: BuilderOptions,
  options: Options,
): Promise<Compiler> {
  const bundler = builderOptions.bundler || 'webpack';

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

  const provider = await getProvider(bundler, finalConfig);

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
    ...(finalConfig.builderPlugins || []),
  ]);

  return builder.createCompiler() as Promise<Compiler>;
}
