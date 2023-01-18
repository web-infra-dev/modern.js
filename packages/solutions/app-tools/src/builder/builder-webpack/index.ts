import { BuilderInstance } from '@modern-js/builder';
import {
  BuilderWebpackProvider,
  builderWebpackProvider,
} from '@modern-js/builder-webpack-provider';
import type { IAppContext } from '@modern-js/core';
import { applyOptionsChain } from '@modern-js/utils';
import { BuilderOptions, createCopyPattern } from '../shared';
import { generateBuilder } from '../generator';
import { PluginCompatModern } from './builderPlugins/compatModern';
import type { AppNormalizedConfig } from '@/types';

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
      // We need to do this in the app-tools prepare hook because some files will be generated into the dist directory in the analyze process
      cleanDistPath: false,
    };
  }
}

/**
 * register builder Plugin by condition
 */
async function applyBuilderPlugins(
  builder: BuilderInstance,
  options: BuilderOptions<'webpack'>,
) {
  const { normalizedConfig } = options;
  if (!normalizedConfig.output.disableNodePolyfill) {
    const { PluginNodePolyfill } = await import(
      '@modern-js/builder-plugin-node-polyfill'
    );
    builder.addPlugins([PluginNodePolyfill()]);
  }

  if (normalizedConfig.tools.esbuild) {
    const { esbuild: esbuildOptions } = normalizedConfig.tools;
    const { PluginEsbuild } = await import('@modern-js/builder-plugin-esbuild');
    builder.addPlugins([
      PluginEsbuild({
        loader: false,
        minimize: applyOptionsChain<any, any>({}, esbuildOptions),
      }),
    ]);
  }

  builder.addPlugins([PluginCompatModern(options)]);
}
