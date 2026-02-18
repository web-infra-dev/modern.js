import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import {
  ModuleFederationPlugin as RspackModuleFederationPlugin,
  TreeShakingSharedPlugin as RspackTreeShakingSharedPlugin,
} from '@module-federation/enhanced/rspack';
import type { moduleFederationPlugin as MFPluginOptions } from '@module-federation/sdk';
import type { InternalModernPluginOptions, PluginOptions } from '../types';
import { moduleFederationConfigPlugin } from './configPlugin';
import { moduleFederationSSRPlugin } from './ssrPlugin';
import { isWebTarget } from './utils';

export const moduleFederationPlugin = (
  userConfig: PluginOptions = {},
): CliPlugin<AppTools> => {
  const internalModernPluginOptions: InternalModernPluginOptions = {
    csrConfig: undefined,
    ssrConfig: undefined,
    browserPlugin: undefined,
    nodePlugin: undefined,
    assetResources: {},
    distOutputDir: '',
    originPluginOptions: { ...userConfig },
    remoteIpStrategy: userConfig?.remoteIpStrategy,
    userConfig: userConfig || {},
    assetFileNames: {},
    fetchServerQuery: userConfig.fetchServerQuery ?? undefined,
    secondarySharedTreeShaking: userConfig.secondarySharedTreeShaking ?? false,
  };
  return {
    name: '@modern-js/plugin-module-federation',
    setup: async api => {
      api.modifyBundlerChain(chain => {
        const browserPluginOptions =
          internalModernPluginOptions.csrConfig as MFPluginOptions.ModuleFederationPluginOptions;
        const { secondarySharedTreeShaking } = internalModernPluginOptions;
        if (isWebTarget(chain.get('target'))) {
          if (secondarySharedTreeShaking) {
            chain
              .plugin('plugin-module-federation')
              .use(RspackTreeShakingSharedPlugin, [
                {
                  mfConfig: browserPluginOptions,
                  secondary: true,
                } as any,
              ]);
          } else {
            chain
              .plugin('plugin-module-federation')
              .use(RspackModuleFederationPlugin, [browserPluginOptions])
              .init((Plugin: typeof RspackModuleFederationPlugin, args) => {
                internalModernPluginOptions.browserPlugin = new Plugin(args[0]);
                return internalModernPluginOptions.browserPlugin;
              });
          }
        }
      });

      api._internalServerPlugins(({ plugins }) => {
        plugins.push({
          name: '@module-federation/modern-js-v3/server',
        });
        return { plugins };
      });
    },
    usePlugins: [
      moduleFederationConfigPlugin(internalModernPluginOptions),
      moduleFederationSSRPlugin(
        internalModernPluginOptions as Required<InternalModernPluginOptions>,
      ),
    ],
  };
};

export default moduleFederationPlugin;

export { createModuleFederationConfig } from '@module-federation/enhanced';

export type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
