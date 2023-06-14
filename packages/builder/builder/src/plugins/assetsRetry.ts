import {
  getDistPath,
  isHtmlDisabled,
  DefaultBuilderPlugin,
} from '@modern-js/builder-shared';

export function builderPluginAssetsRetry(): DefaultBuilderPlugin {
  return {
    name: 'builder-plugin-assets-retry',
    setup(api) {
      api.modifyBundlerChain(
        async (chain, { CHAIN_ID, target, HtmlPlugin }) => {
          const config = api.getNormalizedConfig();

          if (!config.output.assetsRetry || isHtmlDisabled(config, target)) {
            return;
          }

          const { AssetsRetryPlugin } = await import(
            '@modern-js/builder-shared'
          );
          const distDir = getDistPath(config.output, 'js');

          const { assetsRetry = {} } = config.output;

          // assetsRetry.crossOrigin should be same as html.crossorigin by default
          if (assetsRetry.crossOrigin === undefined) {
            assetsRetry.crossOrigin = config.html.crossorigin;
          }

          chain.plugin(CHAIN_ID.PLUGIN.ASSETS_RETRY).use(AssetsRetryPlugin, [
            {
              ...assetsRetry,
              distDir,
              HtmlPlugin,
            },
          ]);
        },
      );
    },
  };
}
