import {
  createPublicContext,
  type BuilderProvider,
} from '@modern-js/builder-shared';
import type { Compiler, MultiCompiler } from 'webpack';
import { createContext } from './core/createContext';
import { initConfigs } from './core/initConfigs';
import { getPluginAPI } from './core/initPlugins';
import { applyDefaultPlugins } from './shared/plugin';
import { BuilderConfig, NormalizedConfig, WebpackConfig } from './types';

export type BuilderWebpackProvider = BuilderProvider<
  BuilderConfig,
  WebpackConfig,
  NormalizedConfig,
  Compiler | MultiCompiler
>;

export function builderWebpackProvider({
  builderConfig,
}: {
  builderConfig: BuilderConfig;
}): BuilderWebpackProvider {
  return async ({ pluginStore, builderOptions, plugins }) => {
    const context = await createContext(builderOptions, builderConfig);
    const pluginAPI = getPluginAPI({ context, pluginStore });

    context.pluginAPI = pluginAPI;

    return {
      bundler: 'webpack',

      pluginAPI,

      publicContext: createPublicContext(context),

      async applyDefaultPlugins() {
        pluginStore.addPlugins(await applyDefaultPlugins(plugins));
      },

      async initConfigs() {
        const { webpackConfigs } = await initConfigs({
          context,
          pluginStore,
          builderOptions,
        });
        return webpackConfigs;
      },

      async createCompiler() {
        const { createCompiler } = await import('./core/createCompiler');
        const { webpackConfigs } = await initConfigs({
          context,
          pluginStore,
          builderOptions,
        });
        return createCompiler({ context, webpackConfigs });
      },

      async startDevServer(options) {
        const { startDevServer } = await import('./core/startDevServer');
        return startDevServer(
          { context, pluginStore, builderOptions },
          options,
        );
      },

      async build(options) {
        const { build: buildImpl, webpackBuild } = await import('./core/build');
        return buildImpl(
          { context, pluginStore, builderOptions },
          options,
          webpackBuild,
        );
      },

      async inspectConfig(inspectOptions) {
        const { inspectConfig } = await import('./core/inspectConfig');
        return await inspectConfig({
          context,
          pluginStore,
          builderOptions,
          inspectOptions,
        });
      },
    };
  };
}
