import { BuilderPlugin } from '../types/plugin';

export function PluginAssetsRetry(): BuilderPlugin {
  return {
    name: 'webpack-builder-plugin-assets-retry',
    setup(api) {
      api.modifyWebpackChain(async (chain, { CHAIN_ID, target }) => {
        const config = api.getBuilderConfig();
        if (!config.output?.assetsRetry || target === 'node') {
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
