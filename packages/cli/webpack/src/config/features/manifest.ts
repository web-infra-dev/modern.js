import { CHAIN_ID } from '@modern-js/utils';
import type { ChainUtils } from '../shared';

export function applyManifestPlugin({ chain }: ChainUtils) {
  const {
    WebpackManifestPlugin,
  }: typeof import('../../../compiled/webpack-manifest-plugin') = require('../../../compiled/webpack-manifest-plugin');

  chain.plugin(CHAIN_ID.PLUGIN.MANIFEST).use(WebpackManifestPlugin, [
    {
      fileName: 'asset-manifest.json',
      publicPath: chain.output.get('publicPath'),
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
}
