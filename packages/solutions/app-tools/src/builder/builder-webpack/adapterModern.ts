import { RsbuildPlugin } from '@modern-js/uni-builder';
import { BuilderOptions } from '../shared';
import { createPublicPattern } from './createCopyPattern';

/**
 * Provides default configuration consistent with modern.js v1
 */
export const builderPluginAdapterModern = (
  options: BuilderOptions<'webpack'>,
): RsbuildPlugin => ({
  name: 'builder-plugin-adapter-modern',

  setup(api) {
    const { normalizedConfig: modernConfig, appContext } = options;

    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      // apply copy plugin
      if (chain.plugins.has(CHAIN_ID.PLUGIN.COPY)) {
        const defaultCopyPattern = createPublicPattern(
          appContext,
          modernConfig,
          chain,
        );
        chain.plugin(CHAIN_ID.PLUGIN.COPY).tap(args => [
          {
            patterns: [...(args[0]?.patterns || []), defaultCopyPattern],
          },
        ]);
      }
    });
  },
});
