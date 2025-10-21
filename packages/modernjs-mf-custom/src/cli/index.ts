import type { CliPluginFuture, AppTools } from '@modern-js/app-tools';
import {
  ModuleFederationPlugin as WebpackModuleFederationPlugin,
  AsyncBoundaryPlugin,
} from '@module-federation/enhanced';
import { ModuleFederationPlugin as RspackModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import type { moduleFederationPlugin as MFPluginOptions } from '@module-federation/sdk';
import type { PluginOptions, InternalModernPluginOptions } from '../types';
import { moduleFederationConfigPlugin } from './configPlugin';
import { moduleFederationSSRPlugin } from './ssrPlugin';
import { isWebTarget } from './utils';

export const moduleFederationPlugin = (
  userConfig: PluginOptions = {},
): CliPluginFuture<AppTools> => {
  const internalModernPluginOptions: InternalModernPluginOptions = {
    csrConfig: undefined,
    ssrConfig: undefined,
    browserPlugin: undefined,
    nodePlugin: undefined,
    distOutputDir: '',
    originPluginOptions: userConfig,
    remoteIpStrategy: userConfig?.remoteIpStrategy,
    userConfig: userConfig || {},
    fetchServerQuery: userConfig.fetchServerQuery ?? undefined,
  };
  return {
    name: '@modern-js/plugin-module-federation',
    setup: async (api) => {
      const modernjsConfig = api.getConfig();

      api.modifyBundlerChain((chain) => {
        const bundlerType =
          api.getAppContext().bundlerType === 'rspack' ? 'rspack' : 'webpack';
        const target = chain.get('target');
        const chainName = chain.get('name');
        const isRSC = chainName === 'server' || chainName === 'client';
        const isWebBuild = isWebTarget(target);

        // DEBUG LOGGING
        console.log('[MF RSC DEBUG] ===============================');
        console.log('[MF RSC DEBUG] Chain Name:', chainName);
        console.log('[MF RSC DEBUG] Target:', target);
        console.log('[MF RSC DEBUG] Is RSC:', isRSC);
        console.log('[MF RSC DEBUG] Is Web Build:', isWebBuild);

        // Apply MF to:
        // 1. RSC builds (server/client chains)
        // 2. Web builds
        // 3. Node builds (for SSR with MF)
        const isNodeBuild = chainName === 'node' || target === 'node';
        const shouldApplyMF = isRSC || isWebBuild || isNodeBuild;
        console.log('[MF RSC DEBUG] Is Node Build:', isNodeBuild);
        console.log('[MF RSC DEBUG] Should Apply MF:', shouldApplyMF);

        if (shouldApplyMF) {
          // Use ssrConfig for server compilation (server chain or node build)
          // Use csrConfig for client compilation (client chain or web build)
          const isServerCompilation = chainName === 'server' || chainName === 'node' || isNodeBuild;
          console.log('[MF RSC DEBUG] Is Server Compilation:', isServerCompilation);

          const pluginOptions = (isServerCompilation
            ? internalModernPluginOptions.ssrConfig
            : internalModernPluginOptions.csrConfig) as MFPluginOptions.ModuleFederationPluginOptions;

          console.log('[MF RSC DEBUG] Plugin Options:', JSON.stringify(pluginOptions, null, 2));

          const MFPlugin =
            bundlerType === 'webpack'
              ? WebpackModuleFederationPlugin
              : RspackModuleFederationPlugin;

          chain
            .plugin('plugin-module-federation')
            .use(MFPlugin, [pluginOptions])
            .init((Plugin: typeof MFPlugin, args) => {
              if (isServerCompilation) {
                internalModernPluginOptions.nodePlugin = new Plugin(args[0]);
                return internalModernPluginOptions.nodePlugin;
              } else {
                internalModernPluginOptions.browserPlugin = new Plugin(args[0]);
                return internalModernPluginOptions.browserPlugin;
              }
            });
        }

        const browserPluginOptions =
          internalModernPluginOptions.csrConfig as MFPluginOptions.ModuleFederationPluginOptions;

        if (bundlerType === 'webpack') {
          const enableAsyncEntry = modernjsConfig.source?.enableAsyncEntry;
          if (!enableAsyncEntry && browserPluginOptions.async !== false) {
            const asyncBoundaryPluginOptions =
              typeof browserPluginOptions.async === 'object'
                ? browserPluginOptions.async
                : {
                    eager: (module) =>
                      module && /\.federation/.test(module?.request || ''),
                    excludeChunk: (chunk) =>
                      chunk.name === browserPluginOptions.name,
                  };
            chain
              .plugin('async-boundary-plugin')
              .use(AsyncBoundaryPlugin, [asyncBoundaryPluginOptions]);
          }
        }
      });

      api._internalServerPlugins(({ plugins }) => {
        plugins.push({
          name: '@module-federation/modern-js/server',
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
