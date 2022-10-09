import { expect, describe, it } from 'vitest';
import { PluginCache } from '../../src/plugins/cache';
import { createStubBuilder } from '../../src/stub/builder';

describe('plugins/cache', () => {
  it('should add cache config correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCache()],
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should watch framework config change', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCache()],
      context: {
        configPath: '/path/to/config.js',
      } as any,
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should watch tsconfig change', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCache()],
      context: {
        tsconfigPath: '/path/to/tsconfig.json',
      } as any,
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should custom cache directory by user', async () => {
    const customCacheDirectory = './node_modules/.cache/tmp';
    const builder = await createStubBuilder({
      plugins: [PluginCache()],
      context: {
        config: {
          performance: {
            buildCache: {
              cacheDirectory: customCacheDirectory,
            },
          },
        },
      } as any,
    });

    const config = await builder.unwrapWebpackConfig();
    expect((config.cache as { cacheDirectory?: string }).cacheDirectory).toBe(
      customCacheDirectory,
    );
  });
});
