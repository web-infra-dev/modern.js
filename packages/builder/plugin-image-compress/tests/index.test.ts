import { it, expect, describe } from 'vitest';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { PluginImage } from '@modern-js/builder-webpack-provider/plugins/image';
import { PluginImageCompress } from '../src';

describe('plugin/image-compress', () => {
  it('should generate correct options', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginImage(), PluginImageCompress()],
    });
    expect(await builder.unwrapWebpackConfig()).toMatchSnapshot();
  });
});
