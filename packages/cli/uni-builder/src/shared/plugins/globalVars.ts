import type { Define } from '@rsbuild/shared';
import type { RsbuildPlugin } from '@rsbuild/core';
import { applyOptionsChain } from '@modern-js/utils';
import type { ChainedGlobalVars } from '../../types';

export const pluginGlobalVars = (
  options?: ChainedGlobalVars,
): RsbuildPlugin => ({
  name: 'uni-builder:global-vars',

  setup(api) {
    api.modifyBundlerChain((chain, { env, target, bundler }) => {
      if (!options) {
        return;
      }

      const globalVars = applyOptionsChain({}, options, { env, target });

      const serializedVars: Define = {};

      Object.entries(globalVars).forEach(([key, value]) => {
        serializedVars[key] = JSON.stringify(value) ?? 'undefined';
      });

      chain.plugin('globalVars').use(bundler.DefinePlugin, [serializedVars]);
    });
  },
});
