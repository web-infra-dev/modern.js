import { expect, describe, it } from 'vitest';
import { PluginImage } from '../../src/plugins/image';
import { createStubBuilder } from '../../src/shared/stub';

describe('plugins/image', () => {
  it('should add image rules correctly', async () => {
    const builder = createStubBuilder({
      plugins: [PluginImage()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to use distPath.image to modify dist path', async () => {
    const builder = createStubBuilder({
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
});
