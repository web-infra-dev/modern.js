import { it, expect, describe } from 'vitest';
import { createStubBuilder } from '@modern-js/webpack-builder/stub';
import { PluginImage } from '@modern-js/webpack-builder/plugins/image';
import { PluginImageCompress } from '../src';

describe('plugin/image-compress', () => {
  it('should generate correct options', async () => {
    const builder = createStubBuilder({
      plugins: [PluginImage(), PluginImageCompress()],
    });
    expect(await builder.unwrapWebpackConfig()).toMatchSnapshot();
  });
});
