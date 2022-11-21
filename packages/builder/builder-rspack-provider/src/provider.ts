import {
  createPublicContext,
  type BuilderProvider,
} from '@modern-js/builder-shared';
import { createContext } from './core/createContext';
import { initConfigs } from './core/initConfigs';
// import { applyDefaultPlugins } from './shared/plugin';
import { BuilderConfig } from './types';

export function builderRspackProvider({
  builderConfig,
}: {
  builderConfig: BuilderConfig;
}): BuilderProvider {
  return async ({ pluginStore, builderOptions }) => {
    const context = await createContext(builderOptions, builderConfig);

    return {
      bundler: 'rspack',

      publicContext: createPublicContext(context),

      async applyDefaultPlugins() {
        // pluginStore.addPlugins(await applyDefaultPlugins());
      },

      async createCompiler() {
        await initConfigs({
          context,
          pluginStore,
          builderOptions,
        });

        return {} as any;
      },

      async startDevServer() {
        return {} as any;
      },

      async build() {
        return {} as any;
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
