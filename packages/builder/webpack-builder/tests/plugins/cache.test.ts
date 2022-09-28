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
});
