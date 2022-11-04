import {
  createPublicContext,
  type BuilderProvider,
} from '@modern-js/builder-shared';
import { createContext } from './core/createContext';
import { applyDefaultPlugins } from './shared/plugin';
import { BuilderConfig } from './types';
import { initConfigs } from './core/initConfigs';

export function builderWebpackProvider({
  builderConfig,
}: {
  builderConfig: BuilderConfig;
}): BuilderProvider {
  return async ({ pluginStore, builderOptions }) => {
    const context = await createContext(builderOptions, builderConfig);

    return {
      bundler: 'webpack',

      publicContext: createPublicContext(context),

      async applyDefaultPlugins() {
        pluginStore.addPlugins(await applyDefaultPlugins());
      },

      async createCompiler({ watch } = {}) {
        const { createCompiler } = await import('./core/createCompiler');
        const { webpackConfigs } = await initConfigs({
          context,
          pluginStore,
          builderOptions,
        });
        return createCompiler({ watch, context, webpackConfigs });
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
