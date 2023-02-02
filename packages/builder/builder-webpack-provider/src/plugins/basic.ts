import type { BuilderPlugin } from '../types';

/**
 * Provide some basic configs of webpack
 */
export const builderPluginBasic = (): BuilderPlugin => ({
  name: 'builder-plugin-basic',

  setup(api) {
    api.modifyWebpackChain(async (chain, { isProd, isServer, isWebWorker }) => {
      // The base directory for resolving entry points and loaders from the configuration.
      chain.context(api.context.rootPath);

      chain.mode(isProd ? 'production' : 'development');

      chain.merge({
        infrastructureLogging: {
          // Using `error` level to avoid `webpack.cache.PackFileCacheStrategy` logs
          level: 'error',
        },
      });

      /**
       * If the chunk size exceeds 3MB, we will throw a warning.
       * If the target is server or web-worker, we will increase
       * the limit to 30MB because they are only single file.
       */
      const maxAssetSize =
        isServer || isWebWorker ? 30 * 1000 * 1000 : 3 * 1000 * 1000;
      chain.performance.maxAssetSize(maxAssetSize);
      chain.performance.maxEntrypointSize(maxAssetSize);

      // This will be futureDefaults in webpack 6
      chain.module.parser.merge({
        javascript: {
          exportsPresence: 'error',
        },
      });
    });
  },
});
