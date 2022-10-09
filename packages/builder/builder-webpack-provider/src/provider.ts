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

<<<<<<< HEAD
      async startDevServer(options) {
        const { startDevServer } = await import('./core/startDevServer');
        return startDevServer(
          { context, pluginStore, builderOptions },
          options,
=======
      async startDevServer({ compiler } = {}) {
        const { startDevServer } = await import('./core/startDevServer');
        return startDevServer(
          { context, pluginStore, builderOptions },
          compiler,
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
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
        const { inspectBundlerConfig } = await import(
          './core/inspectBundlerConfig'
        );
        const { inspectBuilderConfig } = await import(
          './core/inspectBuilderConfig'
        );

        const bundlerConfigs = await inspectBundlerConfig({
          context,
          pluginStore,
          builderOptions,
          inspectOptions,
        });

        const builderConfig = await inspectBuilderConfig({
          context,
          pluginStore,
          builderOptions,
          inspectOptions,
        });

        return {
          builderConfig,
          bundlerConfigs,
        };
      },
    };
  };
}
