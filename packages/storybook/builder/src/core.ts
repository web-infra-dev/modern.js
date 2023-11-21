import { createBuilder, mergeBuilderConfig } from '@modern-js/builder';
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

  const provider = await getProvider(
    bundler,
    mergeBuilderConfig(finalConfig, builderOptions.builderConfig) || {},
  );

  if (!provider) {
    if (bundler) {
      throw new Error(
        `You choose to use ${bundler}, but @modern-js/builder-${bundler}-provider not found in your project, please install it`,
      );
    } else {
      throw new Error(
        `Please install one provider first, try install @modern-js/builder-rspack-provider or @modern-js/builder-webpack-provider first`,
      );
    }
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
