import type { RsbuildPlugin } from '@rsbuild/core';
import { RUNTIME_CHUNK_NAME, RUNTIME_CHUNK_REGEX } from '../shared/utils';

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

      // should not extract runtime chunk when split chunks is disabled
      if (
        chunkSplit?.strategy !== 'all-in-one' &&
        config.splitChunks !== false
      ) {
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

      if (config.output.inlineScripts === undefined) {
        config.output.inlineScripts = RUNTIME_CHUNK_REGEX;
      }
    });
  },
});
