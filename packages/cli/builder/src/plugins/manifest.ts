import type { RsbuildPlugin } from '@rsbuild/core';
import { generateManifest } from '../shared/manifest';

export const pluginManifest = (): RsbuildPlugin => ({
  name: 'builder:manifest',

  setup(api) {
    api.modifyBundlerChain(async (chain, { target, CHAIN_ID }) => {
      const { RspackManifestPlugin } = await import('rspack-manifest-plugin');
      const publicPath = chain.output.get('publicPath');

      // Only pass string public paths to the manifest plugin.
      // Function-valued publicPath is not yet supported by the plugin.
      chain.plugin(CHAIN_ID.PLUGIN.MANIFEST).use(RspackManifestPlugin, [
        {
          fileName:
            target === 'web'
              ? 'asset-manifest.json'
              : `asset-manifest-${target}.json`,
          ...(typeof publicPath === 'string' ? { publicPath } : {}),
          generate: generateManifest,
        },
      ]);
    });
  },
});
