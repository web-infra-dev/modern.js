import type { RsbuildPlugin } from '@rsbuild/core';
import { RUNTIME_CHUNK_NAME } from '../shared/utils';

export const pluginRuntimeChunk = (
  disableInlineRuntimeChunk?: boolean,
): RsbuildPlugin => ({
  name: 'builder:runtime-chunk',

  setup(api) {
    api.modifyBundlerChain(async (chain, { target, environment }) => {
      if (target !== 'web') {
        return;
      }

      const { config } = environment;
      const { chunkSplit } = config.performance;

      // should not extract runtime chunk when strategy is `all-in-one`
      if (chunkSplit.strategy !== 'all-in-one') {
        chain.optimization.runtimeChunk({
          name: RUNTIME_CHUNK_NAME,
        });
      }
    });

    api.modifyRsbuildConfig(config => {
      config.output ||= {};

      if (disableInlineRuntimeChunk) {
        return;
      }

      // RegExp like /bundler-runtime([.].+)?\.js$/
      // matches bundler-runtime.js and bundler-runtime.123456.js
      const regexp = new RegExp(`${RUNTIME_CHUNK_NAME}([.].+)?\\.js$`);

      if (!config.output.inlineScripts) {
        config.output.inlineScripts = regexp;
      }
    });
  },
});
