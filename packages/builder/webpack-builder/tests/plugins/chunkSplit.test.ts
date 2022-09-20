import { expect, describe, it } from 'vitest';
import { PluginSplitChunks } from '../../src/plugins/splitChunks';
import { createStubBuilder } from '../../src/stub/builder';

describe('plugins/splitChunks', () => {
  it('should set split-by-experience config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginSplitChunks()],
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-experience',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set split-by-module config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginSplitChunks()],
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-module',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should set single-vendor config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginSplitChunks()],
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'single-vendor',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should set single-size config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginSplitChunks()],
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-size',
            minSize: 1000,
            maxSize: 5000,
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should set custom config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginSplitChunks()],
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'custom',
            forceSplitting: [/react/],
            splitChunks: {
              cacheGroups: {},
            },
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
