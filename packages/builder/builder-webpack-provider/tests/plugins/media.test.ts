import { expect, describe, it } from 'vitest';
import { PluginMedia } from '../../src/plugins/media';
import { createStubBuilder } from '../../src/stub';

describe('plugins/media', () => {
  it('should add media rules correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginMedia()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to use distPath.media to modify dist path', async () => {
    const builder = await createStubBuilder({
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

  it('should allow to use distPath.media to be empty string', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginMedia()],
      builderConfig: {
        output: {
          distPath: {
            media: '',
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to use filename.media to modify filename', async () => {
    const builder = await createStubBuilder({
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
