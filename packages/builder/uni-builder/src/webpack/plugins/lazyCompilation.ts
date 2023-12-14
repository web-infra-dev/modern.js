import type { RsbuildPlugin } from '@rsbuild/core';

export type LazyCompilationOptions =
  | boolean
  | {
      entries?: boolean;
      imports?: boolean;
    };

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
