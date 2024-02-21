import type { RsbuildPlugin } from '@rsbuild/core';
import { generateManifest } from '../../shared/manifest';

export const pluginManifest = (): RsbuildPlugin => ({
  name: 'uni-builder:manifest',

  setup(api) {
    api.modifyBundlerChain(async (chain, { target, CHAIN_ID }) => {
      const { WebpackManifestPlugin } = await import('webpack-manifest-plugin');
      const publicPath = chain.output.get('publicPath');

      chain.plugin(CHAIN_ID.PLUGIN.MANIFEST).use(WebpackManifestPlugin, [
        {
          fileName:
            target === 'web'
              ? 'asset-manifest.json'
              : `asset-manifest-${target}.json`,
          publicPath,
          generate: generateManifest,
        },
      ]);
    });
  },
});
