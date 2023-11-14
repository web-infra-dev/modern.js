import { createBuilder } from '@modern-js/builder';
import { loadConfig } from '@modern-js/core';
import type { Options } from '@storybook/types';
import type { Compiler } from '@modern-js/builder-shared/webpack-dev-middleware';
import type { PluginItem } from '@babel/core';
import { applyOptionsChain, logger } from '@modern-js/utils';
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

  await addonAdapter(finalConfig, options);

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

/**
 * Some addons expose babel plugins and presets, or modify webpack
 */
async function addonAdapter(finalConfig: BuilderConfig, options: Options) {
  const { presets } = options;
  const babelOptions = await presets.apply('babel', {}, { ...options });

  finalConfig.tools ??= {};
  finalConfig.tools.babel = config => {
    const getPluginName = (plugin: PluginItem) =>
      Array.isArray(plugin) ? plugin[0] : plugin;
    const getOptions = (plugin: PluginItem) =>
      Array.isArray(plugin) ? plugin[1] : null;

    const replaceOrInsert = (plugin: PluginItem, plugins: PluginItem[]) => {
      const pluginName = getPluginName(plugin);

      const append = [];
      for (let i = 0; i < plugins.length; i++) {
        if (getPluginName(plugins[i]) === pluginName) {
          if (getOptions(plugin)) {
            logger.info(
              'Detected duplicated babel plugin, overrides with the new one',
            );
            plugins[i] = plugin;
          }
        } else {
          append.push(plugin);
        }
      }

      plugins.push(...append);
    };

    const currentPlugins = config.plugins || [];

    // O(n * n) but the number of plugins should be small
    for (const plugin of babelOptions.plugins || []) {
      replaceOrInsert(plugin, currentPlugins);
    }

    return {
      ...config,
      ...babelOptions,
      plugins: currentPlugins,
      presets: config.presets,
    };
  };

  finalConfig.tools ??= {};

  // @ts-expect-error tools.webpack not present in rspack config, but it's OK, we only
  // adapt webpack addon now
  finalConfig.tools.webpack = applyOptionsChain(
    // @ts-expect-error tools.webpack not present in rspack config, but it's OK, we only
    finalConfig.tools.webpack,
    async (defaultConfig: any) => {
      const finalDefaultConfig = await presets.apply(
        'webpackFinal',
        defaultConfig,
        options,
      );
      return finalDefaultConfig;
    },
  );
}
