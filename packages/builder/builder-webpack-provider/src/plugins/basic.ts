import type { BuilderPlugin } from '../types';

/**
 * Provide some basic configs of webpack
 */
export const builderPluginBasic = (): BuilderPlugin => ({
  name: 'builder-plugin-basic',

  setup(api) {
    api.modifyWebpackChain(async (chain, { isProd }) => {
      // The base directory for resolving entry points and loaders from the configuration.
      chain.context(api.context.rootPath);

      chain.mode(isProd ? 'production' : 'development');

      chain.merge({
        infrastructureLogging: {
          // Using `error` level to avoid `webpack.cache.PackFileCacheStrategy` logs
          level: 'error',
        },
      });

      // if the chunk size exceeds 1MiB, we will throw a warning
      chain.performance.maxAssetSize(1024 * 1024);
      chain.performance.maxEntrypointSize(1024 * 1024);

      // This will be futureDefaults in webpack 6
      chain.module.parser.merge({
        javascript: {
          exportsPresence: 'error',
        },
      });
    });
  },
});
