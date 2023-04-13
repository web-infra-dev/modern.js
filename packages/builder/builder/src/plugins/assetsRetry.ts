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

          chain.plugin(CHAIN_ID.PLUGIN.ASSETS_RETRY).use(AssetsRetryPlugin, [
            {
              ...(config.output.assetsRetry || {}),
              distDir,
              HtmlPlugin,
            },
          ]);
        },
      );
    },
  };
}
