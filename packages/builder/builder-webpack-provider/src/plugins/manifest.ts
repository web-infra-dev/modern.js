import type { BuilderPlugin } from '../types';

export const PluginManifest = (): BuilderPlugin => ({
  name: 'builder-plugin-manifest',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      if (!config.output.enableAssetManifest) {
        return;
      }

      const { WebpackManifestPlugin } = await import(
        '../../compiled/webpack-manifest-plugin'
      );
      const publicPath = chain.output.get('publicPath');

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
      ]);
    });
  },
});
