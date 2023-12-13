import { SubresourceIntegrityPlugin } from 'webpack-subresource-integrity';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { SriOptions } from '../../types';

export const pluginSRI = (options: SriOptions | boolean): RsbuildPlugin => ({
  name: 'uni-builder:sri',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID }) => {
      chain.output.crossOriginLoading('anonymous');
      chain
        .plugin(CHAIN_ID.PLUGIN.SUBRESOURCE_INTEGRITY)
        .use(SubresourceIntegrityPlugin, [
          typeof options === 'object' ? options : undefined,
        ]);
    });
  },
});
