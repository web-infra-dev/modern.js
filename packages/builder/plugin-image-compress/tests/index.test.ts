import { it, expect, describe } from 'vitest';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { builderAssetPlugin } from '@builder/plugins/asset';
import { builderPluginImageCompress } from '../src';

describe('plugin/image-compress', () => {
  it('should generate correct options', async () => {
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: [
        builderAssetPlugin('image', [
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
        ]),
        builderPluginImageCompress(),
      ],
    });
    expect(await builder.unwrapWebpackConfig()).toMatchSnapshot();
    process.env.NODE_ENV = 'test';
  });
});
