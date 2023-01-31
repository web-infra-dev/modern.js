import { expect, describe, it } from 'vitest';
import { builderPluginSplitChunks } from '@builder/plugins/splitChunks';
import { builderPluginLazyCompilation } from '@/plugins/lazyCompilation';
import { createStubBuilder } from '@/stub/builder';

describe('plugins/lazyCompilation', () => {
  it('should allow to use lazy compilation', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginLazyCompilation()],
      builderConfig: {
        experiments: {
          lazyCompilation: {
            entries: false,
            imports: true,
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toEqual({
      experiments: {
        lazyCompilation: {
          entries: false,
          imports: true,
        },
      },
      optimization: {
        splitChunks: false,
      },
    });
  });

  it('should disable split chunks', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginSplitChunks(), builderPluginLazyCompilation()],
      builderConfig: {
        experiments: {
          lazyCompilation: true,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.optimization?.splitChunks).toEqual(false);
  });

  it('should not apply lazy compilation in production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const builder = await createStubBuilder({
      plugins: [builderPluginLazyCompilation()],
      builderConfig: {
        experiments: {
          lazyCompilation: true,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toEqual({});

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should not apply lazy compilation for node target', async () => {
    const builder = await createStubBuilder({
      target: 'node',
      plugins: [builderPluginLazyCompilation()],
      builderConfig: {
        experiments: {
          lazyCompilation: true,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toEqual({});
  });
});
