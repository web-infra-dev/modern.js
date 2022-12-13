import {
  createPublicContext,
  type BuilderProvider,
} from '@modern-js/builder-shared';
import { createContext } from './core/createContext';
import { initConfigs } from './core/initConfigs';
import { getPluginAPI } from './core/initPlugins';
import { applyDefaultPlugins } from './shared/plugin';
import type {
  Compiler,
  RspackConfig,
  BuilderConfig,
  NormalizedConfig,
} from './types';

export type BuilderRspackProvider = BuilderProvider<
  BuilderConfig,
  RspackConfig,
  NormalizedConfig,
  Compiler
>;

export function builderRspackProvider({
  builderConfig,
}: {
  builderConfig: BuilderConfig;
}): BuilderRspackProvider {
  return async ({ pluginStore, builderOptions, plugins }) => {
    const context = await createContext(builderOptions, builderConfig);
    const pluginAPI = getPluginAPI({ context, pluginStore });

    context.pluginAPI = pluginAPI;

    return {
      bundler: 'rspack',

      pluginAPI,

      publicContext: createPublicContext(context),

      async applyDefaultPlugins() {
        pluginStore.addPlugins(await applyDefaultPlugins(plugins));
      },

      async createCompiler() {
        const { createCompiler } = await import('./core/createCompiler');
        const { rspackConfigs } = await initConfigs({
          context,
          pluginStore,
          builderOptions,
        });

        // todo: compiler 类型定义
        return createCompiler({
          context,
          rspackConfigs,
        }) as any;
      },

      async startDevServer(options) {
        const { startDevServer } = await import('./core/startDevServer');
        return startDevServer(
          { context, pluginStore, builderOptions },
          options,
        );
      },

      async build(options) {
        const { build: buildImpl, rspackBuild } = await import('./core/build');
        return buildImpl(
          { context, pluginStore, builderOptions },
          options,
          rspackBuild,
        );
      },

      async initConfigs() {
        const { rspackConfigs } = await initConfigs({
          context,
          pluginStore,
          builderOptions,
        });
        return rspackConfigs;
      },

      async inspectConfig(inspectOptions) {
        const { inspectConfig } = await import('./core/inspectConfig');
        return inspectConfig({
          context,
          pluginStore,
          builderOptions,
          inspectOptions,
        });
      },
    };
  };
}
