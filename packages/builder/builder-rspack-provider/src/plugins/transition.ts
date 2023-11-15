import type { BuilderPlugin } from '../types';
import { setConfig } from '@modern-js/builder-shared';
/**
 * Provide some temporary configurations for Rspack early transition
 */
export const builderPluginTransition = (): BuilderPlugin => ({
  name: 'builder-plugin-transition',

  setup(api) {
    process.env.RSPACK_CONFIG_VALIDATE = 'loose-silent';

    api.modifyBundlerChain(async (chain, { isProd }) => {
      if (isProd) {
        chain.optimization.chunkIds('deterministic');
      }
    });

    api.modifyRspackConfig(config => {
      setConfig(
        config,
        'experiments.rspackFuture.disableTransformByDefault',
        false,
      );
    });
  },
});
