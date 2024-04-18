import { BuilderOptions } from '../shared';
import { generateBuilder } from '../generator';
import { builderPluginAdapterModern } from './adapterModern';

export async function createWebpackBuilderForModern(
  options: BuilderOptions<'webpack'>,
) {
  const builder = await generateBuilder(options, 'webpack');

  const { normalizedConfig } = options;

  if (normalizedConfig.tools.esbuild) {
    const { esbuild: esbuildOptions } = normalizedConfig.tools;
    const { pluginEsbuild } = await import('@modern-js/rsbuild-plugin-esbuild');

    builder.addPlugins([pluginEsbuild(esbuildOptions)]);
  }

  builder.addPlugins([builderPluginAdapterModern(options)]);

  return builder;
}
