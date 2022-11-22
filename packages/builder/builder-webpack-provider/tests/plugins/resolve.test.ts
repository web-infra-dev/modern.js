import { expect, describe, it } from 'vitest';
import { PluginResolve } from '../../src/plugins/resolve';
import { createStubBuilder } from '../../src/stub';

describe('plugins/resolve', () => {
  it('should apply default extensions correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginResolve()],
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.resolve?.extensions).toEqual([
      '.js',
      '.jsx',
      '.mjs',
      '.json',
    ]);
  });

  it('should allow to use source.alias to config webpack alias', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginResolve()],
      builderConfig: {
        source: {
          alias: {
            foo: 'bar',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config.resolve?.alias).toEqual({
      foo: 'bar',
    });
  });

  it('should support source.alias to be a function', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginResolve()],
      builderConfig: {
        source: {
          alias() {
            return {
              foo: 'bar',
            };
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config.resolve?.alias).toEqual({
      foo: 'bar',
    });
  });

  it('should disable resolve.fullySpecified by default', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginResolve()],
      builderConfig: {
        source: {
          compileJsDataURI: true,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should support custom webpack resolve.mainFields', async () => {
    const mainFieldsOption = ['main', 'test', 'broswer', ['module', 'exports']];

    const builder = await createStubBuilder({
      plugins: [PluginResolve()],
      builderConfig: {
        source: {
          resolveMainFields: mainFieldsOption,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config.resolve?.mainFields).toEqual(mainFieldsOption);
  });
});
