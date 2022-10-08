import { expect, describe, it } from 'vitest';
import { PluginMinimize } from '../../src/plugins/minimize';
import { createStubBuilder } from '../../src/stub';

describe('plugins/minimize', () => {
  it('should not apply minimizer in development', async () => {
    process.env.NODE_ENV = 'development';

    const builder = await createStubBuilder({
      plugins: [PluginMinimize()],
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.optimization?.minimize).toEqual(false);

    process.env.NODE_ENV = 'test';
  });

  it('should apply minimizer in production', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createStubBuilder({
      plugins: [PluginMinimize()],
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.optimization).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should not apply minimizer when output.disableMinimize is true', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createStubBuilder({
      plugins: [PluginMinimize()],
      builderConfig: {
        output: {
          disableMinimize: true,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.optimization?.minimize).toEqual(false);

    process.env.NODE_ENV = 'test';
  });

  it('should not extractComments when output.legalComments is inline', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createStubBuilder({
      plugins: [PluginMinimize()],
      builderConfig: {
        output: {
          legalComments: 'inline',
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(JSON.stringify(config.optimization)).toContain(
      '"extractComments":false',
    );
    expect(JSON.stringify(config.optimization)).not.toContain(
      '"comments":false',
    );

    process.env.NODE_ENV = 'test';
  });

  it('should remove all comments when output.legalComments is none', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createStubBuilder({
      plugins: [PluginMinimize()],
      builderConfig: {
        output: {
          legalComments: 'none',
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(JSON.stringify(config.optimization)).toContain(
      '"extractComments":false',
    );
    expect(JSON.stringify(config.optimization)).toContain('"comments":false');

    process.env.NODE_ENV = 'test';
  });
});
