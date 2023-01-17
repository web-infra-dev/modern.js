import { it, expect, describe } from 'vitest';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { builderPluginImage } from '@modern-js/builder-webpack-provider/plugins/image';
import { builderPluginImageCompress } from '../src';

describe('plugin/image-compress', () => {
  it('should generate correct options', async () => {
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: [builderPluginImage(), builderPluginImageCompress()],
    });
    expect(await builder.unwrapWebpackConfig()).toMatchSnapshot();
    process.env.NODE_ENV = 'test';
  });
});
