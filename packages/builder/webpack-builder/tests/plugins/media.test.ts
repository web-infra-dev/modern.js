import { expect, describe, it } from 'vitest';
import { PluginMedia } from '../../src/plugins/media';
import { createStubBuilder } from '../utils/builder';

describe('plugins/media', () => {
  it('should add media rules correctly', async () => {
    const builder = createStubBuilder({
      plugins: [PluginMedia()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to use distPath.media to modify dist path', async () => {
    const builder = createStubBuilder({
      plugins: [PluginMedia()],
      builderConfig: {
        output: {
          distPath: {
            media: 'foo',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to use filename.media to modify filename', async () => {
    const builder = createStubBuilder({
      plugins: [PluginMedia()],
      builderConfig: {
        output: {
          filename: {
            media: 'foo[ext]',
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
