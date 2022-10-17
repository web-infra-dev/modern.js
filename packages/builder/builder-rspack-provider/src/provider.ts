import {
  createPublicContext,
  type BuilderProvider,
} from '@modern-js/builder-shared';
import { createContext } from './core/createContext';
import { initConfigs } from './core/initConfigs';
import { applyDefaultPlugins } from './shared/plugin';
import { BuilderConfig } from './types';

export function builderRspackProvider({
  builderConfig,
}: {
  builderConfig: BuilderConfig;
}): any {
  return async ({ pluginStore, builderOptions }: any) => {
    const context = await createContext(builderOptions, builderConfig);

    return {
      bundler: 'rspack',

      publicContext: createPublicContext(context),

      async applyDefaultPlugins() {
        pluginStore.addPlugins(await applyDefaultPlugins());
      },

      async createCompiler({ watch }: any = {}) {
        const { createCompiler } = await import('./core/createCompiler');
        const { rspackConfigs } = await initConfigs({
          context,
          pluginStore,
          builderOptions,
        });

        return createCompiler({ watch, context, rspackConfigs });
      },

      // async startDevServer(options) {},

      // async build(options) {},

      // async inspectConfig(inspectOptions) {},
    };
  };
}
