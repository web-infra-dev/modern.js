import { BuilderInstance } from '@modern-js/builder';
import {
  BuilderWebpackProvider,
  builderWebpackProvider,
} from '@modern-js/builder-webpack-provider';
import { BuilderOptions } from '../shared';
import { generateBuilder } from '../generator';
import { builderPluginAdapterModern } from './adapterModern';

export function createWebpackBuilderForModern(
  options: BuilderOptions<'webpack'>,
): Promise<BuilderInstance<BuilderWebpackProvider>> {
  return generateBuilder(options, builderWebpackProvider, {
    async modifyBuilderInstance(builder) {
      await applyBuilderPlugins(builder, options);
    },
  });
}

/** register builder Plugin by condition */
async function applyBuilderPlugins(
  builder: BuilderInstance,
  options: BuilderOptions<'webpack'>,
) {
  const { normalizedConfig } = options;

  if (normalizedConfig.tools.esbuild) {
    const { esbuild: esbuildOptions } = normalizedConfig.tools;
    const { builderPluginEsbuild } = await import(
      '@modern-js/builder-plugin-esbuild'
    );
    builder.addPlugins([builderPluginEsbuild(esbuildOptions)]);
  }

  builder.addPlugins([builderPluginAdapterModern(options)]);
}
