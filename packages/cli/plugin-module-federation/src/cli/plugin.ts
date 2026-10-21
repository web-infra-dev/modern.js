import type { FederationCliPlugin } from '../types/cli';
import {
  ModuleFederationPlugin as RspackModuleFederationPlugin,
  TreeShakingSharedPlugin as RspackTreeShakingSharedPlugin,
} from '@module-federation/enhanced/rspack';
import type { moduleFederationPlugin as MFPluginOptions } from '@module-federation/sdk';
import type { PluginOptions, InternalModernPluginOptions } from '../types';
import { moduleFederationConfigPlugin } from './configPlugin';
import { moduleFederationSSRPlugin } from './ssrPlugin';
import { isWebTarget, resolveInternalPlugin } from './utils';

export const moduleFederationPlugin = (
  userConfig: PluginOptions = {},
): FederationCliPlugin => {
  const internalModernPluginOptions: InternalModernPluginOptions = {
    csrConfig: undefined,
    ssrConfig: undefined,
    browserPlugin: undefined,
    nodePlugin: undefined,
    assetResources: {},
    distOutputDir: '',
    originPluginOptions: { ...userConfig },
    userConfig: userConfig || {},
    assetFileNames: {},
    fetchServerQuery: userConfig.fetchServerQuery ?? undefined,
    secondarySharedTreeShaking: userConfig.secondarySharedTreeShaking ?? false,
  };
  return {
    name: '@modern-js/builtin-module-federation-implementation',
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
          name: resolveInternalPlugin('../server/index'),
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
