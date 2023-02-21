import type { BuilderPlugin } from '../types';

export const builderPluginLazyCompilation = (): BuilderPlugin => ({
  name: 'builder-plugin-lazy-compilation',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, isServer, isWebWorker }) => {
      const config = api.getNormalizedConfig();
      if (
        isProd ||
        isServer ||
        isWebWorker ||
        !config.experiments.lazyCompilation
      ) {
        return;
      }

      // lazyCompilation will be failed in some cases when using splitChunks.
      chain.optimization.splitChunks(false);

      chain.experiments({
        ...chain.get('experiments'),
        lazyCompilation: config.experiments.lazyCompilation,
      });
    });
  },
});
