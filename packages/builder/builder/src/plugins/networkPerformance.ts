import {
  HtmlNetworkPerformancePlugin,
  type DefaultBuilderPlugin,
} from '@modern-js/builder-shared';

export const builderPluginNetworkPerformance = (): DefaultBuilderPlugin => ({
  name: `builder-plugin-network-performance`,

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, isServer, isWebWorker, HtmlPlugin }) => {
        const config = api.getNormalizedConfig();
        const {
          performance: { dnsPrefetch, preconnect },
        } = config;

        if (isServer || isWebWorker || isServiceWorker) {
          return;
        }

        if (dnsPrefetch) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HTML_DNS_PREFETCH)
            .use(HtmlNetworkPerformancePlugin, [
              dnsPrefetch,
              'dnsPrefetch',
              HtmlPlugin,
            ]);
        }

        if (preconnect) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HTML_PRECONNECT)
            .use(HtmlNetworkPerformancePlugin, [
              preconnect,
              'preconnect',
              HtmlPlugin,
            ]);
        }
      },
    );
  },
});
