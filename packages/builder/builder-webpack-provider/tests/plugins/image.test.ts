import { expect, describe, it } from 'vitest';
import { PluginImage } from '@/plugins/image';
import { createStubBuilder } from '@/stub';

describe('plugins/image', () => {
  it('should add image rules correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginImage()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to use distPath.image to modify dist path', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginImage()],
      builderConfig: {
        output: {
          distPath: {
            image: 'foo',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to use distPath.image to be empty string', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginImage()],
      builderConfig: {
        output: {
          distPath: {
            image: '',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to use filename.image to modify filename', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginImage()],
      builderConfig: {
        output: {
          filename: {
            image: 'foo[ext]',
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
