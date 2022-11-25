import { expect, describe, it } from 'vitest';
import { PluginSplitChunks } from '@/plugins/splitChunks';
import { createStubBuilder } from '@/stub/builder';

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

  it('should set all-in-one config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginSplitChunks()],
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'all-in-one',
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

  it('should not split chunks when target is not', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginSplitChunks()],
      target: 'node',
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
