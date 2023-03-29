import { it, expect, describe } from 'vitest';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { builderAssetPlugin } from '@builder/plugins/asset';
import { builderPluginImageCompress } from '../src';

process.env.NODE_ENV = 'production';

const ASSET_EXTS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'webp',
  'ico',
  'apng',
  'avif',
  'tiff',
];

describe('plugin/image-compress', () => {
  it('should generate correct options', async () => {
    const builder = await createStubBuilder({
      plugins: [
        builderAssetPlugin('image', ASSET_EXTS),
        builderPluginImageCompress(),
      ],
    });
    expect(await builder.unwrapWebpackConfig()).toMatchSnapshot();
  });

  it('should accept `...options: Options[]` as parameter', async () => {
    const builder = await createStubBuilder({
      plugins: [
        builderAssetPlugin('image', ASSET_EXTS),
        builderPluginImageCompress('jpeg', { use: 'png' }),
      ],
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.optimization?.minimizer).toMatchInlineSnapshot(`
      [
        ModernJsImageMinimizerPlugin {
          "name": "@modern-js/builder-plugin-image-compress/minimizer",
          "options": {
            "test": /\\\\\\.\\(jpg\\|jpeg\\)\\$/,
            "use": "jpeg",
          },
        },
        ModernJsImageMinimizerPlugin {
          "name": "@modern-js/builder-plugin-image-compress/minimizer",
          "options": {
            "test": /\\\\\\.png\\$/,
            "use": "png",
          },
        },
      ]
    `);
  });

  it('should accept `options: Options[]` as parameter', async () => {
    const builder = await createStubBuilder({
      plugins: [
        builderAssetPlugin('image', ASSET_EXTS),
        builderPluginImageCompress(['jpeg', { use: 'png' }]),
      ],
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.optimization?.minimizer).toMatchInlineSnapshot(`
      [
        ModernJsImageMinimizerPlugin {
          "name": "@modern-js/builder-plugin-image-compress/minimizer",
          "options": {
            "test": /\\\\\\.\\(jpg\\|jpeg\\)\\$/,
            "use": "jpeg",
          },
        },
        ModernJsImageMinimizerPlugin {
          "name": "@modern-js/builder-plugin-image-compress/minimizer",
          "options": {
            "test": /\\\\\\.png\\$/,
            "use": "png",
          },
        },
      ]
    `);
  });
});
