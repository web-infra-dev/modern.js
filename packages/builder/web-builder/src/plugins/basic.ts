import type { BuilderPlugin } from '../types';

/**
 * Provide some basic configs of webpack
 */
export const PluginBasic = (): BuilderPlugin => ({
  name: 'web-builder-plugin-basic',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd }) => {
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
