import { expect, describe, it } from 'vitest';
import { PluginFont } from '../../src/plugins/font';
import { createStubBuilder } from '../../src/shared/stub';

describe('plugins/font', () => {
  it('should add font rules correctly', async () => {
    const builder = createStubBuilder({
      plugins: [PluginFont()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to use distPath.font to modify dist path', async () => {
    const builder = createStubBuilder({
      plugins: [PluginFont()],
      builderConfig: {
        output: {
          distPath: {
            font: 'foo',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to use filename.font to modify filename', async () => {
    const builder = createStubBuilder({
      plugins: [PluginFont()],
      builderConfig: {
        output: {
          filename: {
            font: 'foo[ext]',
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
