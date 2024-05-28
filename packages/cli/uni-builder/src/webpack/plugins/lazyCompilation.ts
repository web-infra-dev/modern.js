import type { RsbuildPlugin } from '@rsbuild/core';
import type { DevConfig } from '@rsbuild/shared';

type LazyCompilationOptions = DevConfig['lazyCompilation'];

export const pluginLazyCompilation = (
  options: LazyCompilationOptions,
): RsbuildPlugin => ({
  name: 'uni-builder:lazy-compilation',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd, isServer, isWebWorker }) => {
      if (isProd || isServer || isWebWorker || !options) {
        return;
      }

      // lazyCompilation will be failed in some cases when using splitChunks.
      chain.optimization.splitChunks(false);

      chain.experiments({
        ...chain.get('experiments'),
        lazyCompilation: options,
      });
    });
  },
});
