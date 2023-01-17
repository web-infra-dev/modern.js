import { expect, describe, it } from 'vitest';
import { builderPluginResolve } from '@/plugins/resolve';
import { createStubBuilder } from '@/stub';

describe('plugins/resolve', () => {
  it('should apply default extensions correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginResolve()],
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.resolve?.extensions).toEqual([
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.json',
    ]);
  });

  it('should allow to use source.alias to config webpack alias', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginResolve()],
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
      plugins: [builderPluginResolve()],
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
      plugins: [builderPluginResolve()],
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
    const mainFieldsOption = ['main', 'test', 'browser', ['module', 'exports']];

    const builder = await createStubBuilder({
      plugins: [builderPluginResolve()],
      builderConfig: {
        source: {
          resolveMainFields: mainFieldsOption,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config.resolve?.mainFields).toEqual(mainFieldsOption);
  });

  it('should support custom webpack resolve.mainFields by target', async () => {
    const mainFieldsOption = {
      web: ['main', 'browser'],
      node: ['main', 'node'],
    };

    const builder = await createStubBuilder({
      plugins: [builderPluginResolve()],
      builderConfig: {
        source: {
          resolveMainFields: mainFieldsOption,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config.resolve?.mainFields).toEqual(mainFieldsOption.web);
  });
});
