import { expect, describe, it } from 'vitest';
import { builderPluginReact } from '@/plugins/react';
import { builderPluginBabel } from '@/plugins/babel';
import { builderPluginTsLoader } from '@/plugins/tsLoader';
import { createStubBuilder } from '@/stub/builder';

describe('plugins/react', () => {
  it('should work with babel-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginBabel(), builderPluginReact()],
      builderConfig: {
        tools: {
          tsChecker: false,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should work with ts-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginTsLoader(), builderPluginReact()],
      builderConfig: {
        tools: {
          tsLoader: {},
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not apply react refresh when dev.hmr is false', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginReact()],
      builderConfig: {
        dev: {
          hmr: false,
        },
      },
    });

    expect(await builder.matchWebpackPlugin('ReactRefreshPlugin')).toBeFalsy();
  });

  it('should not apply react refresh when target is node', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginReact()],
      target: 'node',
    });

    expect(await builder.matchWebpackPlugin('ReactRefreshPlugin')).toBeFalsy();
  });

  it('should not apply react refresh when target is web-worker', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginReact()],
      target: 'web-worker',
    });

    expect(await builder.matchWebpackPlugin('ReactRefreshPlugin')).toBeFalsy();
  });
});
