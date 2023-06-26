import type { BuilderPlugin } from '../types';
import { generateManifest } from '@modern-js/builder-shared';

export const builderPluginManifest = (): BuilderPlugin => ({
  name: 'builder-plugin-manifest',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      if (!config.output.enableAssetManifest) {
        return;
      }

      const { WebpackManifestPlugin } = await import('rspack-manifest-plugin');
      const publicPath = chain.output.get('publicPath');

      chain.plugin(CHAIN_ID.PLUGIN.MANIFEST).use(WebpackManifestPlugin, [
        {
          fileName: 'asset-manifest.json',
          publicPath,
          generate: generateManifest,
        },
      ]);
    });
  },
});
