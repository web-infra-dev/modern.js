import { BuilderPlugin, mergeBuilderConfig } from '@modern-js/builder-shared';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import type { BuilderOptions } from '../types';
import type { AppNormalizedConfig, Bundler, ServerUserConfig } from '@/types';

export const builderPluginAdapterModern = <B extends Bundler>({
  normalizedConfig,
}: BuilderOptions<B>): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-adapter-modern',

  setup(api) {
    api.modifyBuilderConfig(config => {
      if (isStreamingSSR(normalizedConfig)) {
        return mergeBuilderConfig(config, {
          html: {
            inject: 'body',
          },
        });
      }
      return config;
    });

    api.modifyBundlerChain((chain, { target }) => {
      // const builderConfig = api.getNormalizedConfig();
      // set bundler config name
      if (target === 'node') {
        chain.name('server');
      } else if (target === 'modern-web') {
        chain.name('modern');
      } else {
        chain.name('client');
      }
    });
  },
});

const isStreamingSSR = (userConfig: AppNormalizedConfig): boolean => {
  const isStreaming = (ssr: ServerUserConfig['ssr']) =>
    ssr && typeof ssr === 'object' && ssr.mode === 'stream';

  const { server } = userConfig;

  if (isStreaming(server.ssr)) {
    return true;
  }

  // Since we cannot apply different plugins for different entries,
  // we regard the whole app as streaming ssr only if one entry meets the requirement.
  if (server?.ssrByEntries && typeof server.ssrByEntries === 'object') {
    for (const name of Object.keys(server.ssrByEntries)) {
      if (isStreaming(server.ssrByEntries[name])) {
        return true;
      }
    }
  }

  return false;
};
