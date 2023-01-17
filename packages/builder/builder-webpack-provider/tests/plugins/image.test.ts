import { expect, describe, it } from 'vitest';
import { builderPluginImage } from '@/plugins/image';
import { createStubBuilder } from '@/stub';

describe('plugins/image', () => {
  it('should add image rules correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginImage()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to use distPath.image to modify dist path', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginImage()],
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
      plugins: [builderPluginImage()],
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
      plugins: [builderPluginImage()],
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
