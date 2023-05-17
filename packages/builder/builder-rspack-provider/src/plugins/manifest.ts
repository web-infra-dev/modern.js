import type { BuilderPlugin } from '../types';

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

      // todo: plugin params type
      chain.plugin(CHAIN_ID.PLUGIN.MANIFEST).use(WebpackManifestPlugin, [
        {
          fileName: 'asset-manifest.json',
          publicPath,
          generate: (seed, files, entries) => {
            const manifestFiles = files.reduce((manifest, file) => {
              manifest[file.name] = file.path;
              return manifest;
            }, seed);

            const entrypointFiles = Object.keys(entries).reduce<string[]>(
              (previous, name) =>
                previous.concat(
                  entries[name].filter(fileName => !fileName.endsWith('.map')),
                ),
              [],
            );

            return {
              files: manifestFiles,
              entrypoints: entrypointFiles,
            };
          },
        },
      ] as ConstructorParameters<typeof WebpackManifestPlugin>);
    });
  },
});
