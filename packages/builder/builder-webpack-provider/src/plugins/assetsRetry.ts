import { BuilderPlugin } from '../types';
import { isHtmlDisabled } from './html';

export function PluginAssetsRetry(): BuilderPlugin {
  return {
    name: 'builder-plugin-assets-retry',
    setup(api) {
      api.modifyWebpackChain(async (chain, { CHAIN_ID, target }) => {
        const config = api.getNormalizedConfig();

        if (!config.output.assetsRetry || isHtmlDisabled(config, target)) {
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
