import { BuilderInstance } from '@modern-js/builder';
import {
  BuilderWebpackProvider,
  builderWebpackProvider,
} from '@modern-js/builder-webpack-provider';
import { BuilderOptions } from '../shared';
import { generateBuilder } from '../generator';
import { builderPluginAdapterModern } from './adapterModern';

export async function createWebpackBuilderForModern(
  options: BuilderOptions<'webpack'>,
): Promise<BuilderInstance<BuilderWebpackProvider>> {
  const builder = await generateBuilder(options, builderWebpackProvider);

  const { normalizedConfig } = options;

  // NB: `experiments` is undefined by default
  if (normalizedConfig?.experiments?.sourceBuild !== false) {
    const { builderPluginSourceBuild } = await import(
      '@modern-js/builder-plugin-source-build'
    );
    builder.addPlugins([
      builderPluginSourceBuild({
        sourceField: 'source',
        projectName: options.appContext.packageName,
      }),
    ]);
  }

  if (normalizedConfig.tools.esbuild) {
    const { esbuild: esbuildOptions } = normalizedConfig.tools;
    const { builderPluginEsbuild } = await import(
      '@modern-js/builder-plugin-esbuild'
    );
    builder.addPlugins([builderPluginEsbuild(esbuildOptions)]);
  }

  builder.addPlugins([builderPluginAdapterModern(options)]);

  return builder;
}
