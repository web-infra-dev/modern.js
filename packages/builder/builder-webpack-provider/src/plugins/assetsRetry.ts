import { BuilderPlugin } from '../types';

export function PluginAssetsRetry(): BuilderPlugin {
  return {
    name: 'builder-plugin-assets-retry',
    setup(api) {
      api.modifyWebpackChain(async (chain, { CHAIN_ID, target }) => {
        const config = api.getNormalizedConfig();
        if (!config.output.assetsRetry || target === 'node') {
          return;
        }
        const { AssetsRetryPlugin } = await import(
          '../webpackPlugins/AssetsRetryPlugin'
        );
        chain
          .plugin(CHAIN_ID.PLUGIN.ASSETS_RETRY)
          .use(AssetsRetryPlugin, [config.output.assetsRetry]);
      });
    },
  };
}
