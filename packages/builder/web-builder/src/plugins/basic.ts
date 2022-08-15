import type { BuilderPlugin } from '../types';

/**
 * Provide some basic configs of webpack
 */
export const PluginBasic = (): BuilderPlugin => ({
  name: 'web-builder-plugin-basic',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd }) => {
      // The base directory for resolving entry points and loaders from the configuration.
      chain.context(api.context.rootPath);

      chain.mode(isProd ? 'production' : 'development');

      chain.merge({
        infrastructureLogging: {
          // Using `error` level to avoid `webpack.cache.PackFileCacheStrategy` logs
          level: 'error',
        },
      });
    });
  },
});
