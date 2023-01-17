import { expect, describe, it } from 'vitest';
import { builderPluginFont } from '@/plugins/font';
import { createStubBuilder } from '@/stub';

describe('plugins/font', () => {
  it('should add font rules correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginFont()],
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to use distPath.font to modify dist path', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginFont()],
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

  it('should allow to use distPath.font to be empty string', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginFont()],
      builderConfig: {
        output: {
          distPath: {
            font: '',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to use filename.font to modify filename', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginFont()],
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
