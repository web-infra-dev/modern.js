import type { BuilderPlugin } from '../types';
import { applyBuilderBasicPlugin } from '@modern-js/builder-shared';

/**
 * Provide some basic configs of webpack
 */
export const builderPluginBasic = (): BuilderPlugin => ({
  name: 'builder-plugin-basic',

  setup(api) {
    applyBuilderBasicPlugin(api);

    api.modifyWebpackChain(async (chain, { isServer, isWebWorker }) => {
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
