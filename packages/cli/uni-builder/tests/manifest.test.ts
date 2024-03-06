import { expect, describe, it } from 'vitest';
import { createUniBuilder } from '../src';
import { matchPlugins, unwrapConfig } from './helper';

describe('plugin-manifest', () => {
  it('should register manifest plugin correctly', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        output: {
          enableAssetManifest: true,
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchPlugins(config, 'WebpackManifestPlugin'))
      .toMatchInlineSnapshot(`
      [
        WebpackManifestPlugin {
          "options": {
            "assetHookStage": Infinity,
            "basePath": "",
            "fileName": "asset-manifest.json",
            "filter": null,
            "generate": [Function],
            "map": null,
            "publicPath": "/",
            "removeKeyHash": /\\(\\[a-f0-9\\]\\{16,32\\}\\\\\\.\\?\\)/gi,
            "seed": undefined,
            "serialize": [Function],
            "sort": null,
            "transformExtensions": /\\^\\(gz\\|map\\)\\$/i,
            "useEntryKeys": false,
            "useLegacyEmit": false,
            "writeToFileEmit": false,
          },
        },
      ]
    `);
  });

  it('should register manifest plugin correctly when target is node', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      target: ['node'],
      config: {
        output: {
          enableAssetManifest: true,
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchPlugins(config, 'WebpackManifestPlugin'))
      .toMatchInlineSnapshot(`
        [
          WebpackManifestPlugin {
            "options": {
              "assetHookStage": Infinity,
              "basePath": "",
              "fileName": "asset-manifest-node.json",
              "filter": null,
              "generate": [Function],
              "map": null,
              "publicPath": "/",
              "removeKeyHash": /\\(\\[a-f0-9\\]\\{16,32\\}\\\\\\.\\?\\)/gi,
              "seed": undefined,
              "serialize": [Function],
              "sort": null,
              "transformExtensions": /\\^\\(gz\\|map\\)\\$/i,
              "useEntryKeys": false,
              "useLegacyEmit": false,
              "writeToFileEmit": false,
            },
          },
        ]
      `);
  });
});
