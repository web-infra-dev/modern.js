import { generateBuilder } from '../generator';
import type { BuilderOptions } from '../shared';

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

  return builder;
}
