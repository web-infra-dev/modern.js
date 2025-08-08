import { isPlainObject } from '@modern-js/utils';
import type { RsbuildPlugin, SplitChunks } from '@rsbuild/core';

export const pluginSplitChunks = (): RsbuildPlugin => ({
  name: 'builder:split-chunks',

  setup(api) {
    api.modifyBundlerChain((chain, { environment }) => {
      const { config } = environment;
      const { chunkSplit } = config.performance || {};

      if (chunkSplit?.strategy !== 'split-by-experience') {
        return;
      }

      const currentConfig = chain.optimization.splitChunks.values();

      if (!isPlainObject(currentConfig)) {
        return;
      }

      chain.optimization.splitChunks({
        ...currentConfig,
        // rspack chunks type mismatch with webpack
        cacheGroups: {
          ...(currentConfig as Exclude<SplitChunks, false>).cacheGroups,
        },
      });
    });
  },
});
