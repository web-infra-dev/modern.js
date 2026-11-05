import type { RsbuildPlugin } from '@rsbuild/core';
import { RUNTIME_CHUNK_NAME, RUNTIME_CHUNK_REGEX } from '../shared/utils';

/**
 * The runtime chunk is inlined into the HTML to save a request. It grows with the number
 * of async chunks (it carries the chunk id -> file name map), and inlined bytes are
 * downloaded again on every page view because the HTML is not cached. Above this size
 * it is emitted as a normal, cacheable file instead.
 */
export const RUNTIME_CHUNK_INLINE_LIMIT = 10 * 1024;

export const shouldInlineRuntimeChunk = ({
  name,
  size,
}: {
  name: string;
  size: number;
}): boolean =>
  RUNTIME_CHUNK_REGEX.test(name) && size <= RUNTIME_CHUNK_INLINE_LIMIT;

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

      const originalConfig = api.getRsbuildConfig('original');
      if (originalConfig.output?.inlineScripts === undefined) {
        config.output.inlineScripts = shouldInlineRuntimeChunk;
      }
    });
  },
});
