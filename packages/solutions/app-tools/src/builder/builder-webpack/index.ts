import { BuilderInstance } from '@modern-js/builder';
import {
  BuilderWebpackProvider,
  builderWebpackProvider,
} from '@modern-js/builder-webpack-provider';
import type { IAppContext } from '@modern-js/core';
import { BuilderOptions, createCopyPattern } from '../shared';
import { generateBuilder } from '../generator';
import type { AppNormalizedConfig } from '../../types';
import { builderPluginCompatModern } from './builderPlugins/compatModern';

export function createWebpackBuilderForModern(
  options: BuilderOptions<'webpack'>,
): Promise<BuilderInstance<BuilderWebpackProvider>> {
  return generateBuilder(options, builderWebpackProvider, {
    modifyBuilderConfig(config) {
      modifyOutputConfig(config, options.appContext);
    },
    async modifyBuilderInstance(builder) {
      await applyBuilderPlugins(builder, options);
    },
  });
}

function modifyOutputConfig(
  config: AppNormalizedConfig<'webpack'>,
  appContext: IAppContext,
) {
  config.output = createOutputConfig(config, appContext);

  function createOutputConfig(
    config: AppNormalizedConfig<'webpack'>,
    appContext: IAppContext,
  ) {
    const defaultCopyPattern = createCopyPattern(appContext, config, 'upload');
    const { copy } = config.output;
    const copyOptions = Array.isArray(copy) ? copy : copy?.patterns;
    const builderCopy = [...(copyOptions || []), defaultCopyPattern];
    return {
      ...config.output,
      copy: builderCopy,
    };
  }
}

/** register builder Plugin by condition */
async function applyBuilderPlugins(
  builder: BuilderInstance,
  options: BuilderOptions<'webpack'>,
) {
  const { normalizedConfig } = options;
  if (!normalizedConfig.output.disableNodePolyfill) {
    const { builderPluginNodePolyfill } = await import(
      '@modern-js/builder-plugin-node-polyfill'
    );
    builder.addPlugins([builderPluginNodePolyfill()]);
  }

  if (normalizedConfig.tools.esbuild) {
    const { esbuild: esbuildOptions } = normalizedConfig.tools;
    const { builderPluginEsbuild } = await import(
      '@modern-js/builder-plugin-esbuild'
    );
    builder.addPlugins([builderPluginEsbuild(esbuildOptions)]);
  }

  builder.addPlugins([builderPluginCompatModern(options)]);
}
