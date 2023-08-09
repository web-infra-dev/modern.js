import {
  HTMLPreloadOrPrefetchPlugin,
  type DefaultBuilderPlugin,
} from '@modern-js/builder-shared';

export const builderPluginPreloadOrPrefetch = (): DefaultBuilderPlugin => ({
  name: `builder-plugin-preload-or-prefetch`,

  setup(api) {
    api.modifyBundlerChain(
      async (
        chain,
        { CHAIN_ID, isServer, isWebWorker, isServiceWorker, HtmlPlugin },
      ) => {
        const config = api.getNormalizedConfig();
        const {
          performance: { preload, prefetch },
        } = config;

        if (isServer || isWebWorker || isServiceWorker) {
          return;
        }

        const HTMLCount = chain.entryPoints.values().length;

        if (prefetch) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HTML_PREFETCH)
            .use(HTMLPreloadOrPrefetchPlugin, [
              prefetch,
              'prefetch',
              HtmlPlugin,
              HTMLCount,
            ]);
        }

        if (preload) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HTML_PRELOAD)
            .use(HTMLPreloadOrPrefetchPlugin, [
              preload,
              'preload',
              HtmlPlugin,
              HTMLCount,
            ]);
        }
      },
    );
  },
});
