import { expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { builderPluginSplitChunks } from '@/plugins/splitChunks';

describe('plugins/splitChunks', () => {
  const cases = [
    {
      name: 'should set split-by-experience config',
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-experience',
          },
        },
        output: {},
      },
    },
    {
      name: 'should set split-by-experience config correctly when polyfill is off',
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-experience',
          },
        },
        output: {
          polyfill: 'off',
        },
      },
    },
    {
      name: 'should set split-by-module config',
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-module',
          },
        },
        output: {},
      },
    },
    {
      name: 'should set single-vendor config',
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'single-vendor',
          },
        },
        output: {},
      },
    },
    {
      name: 'should set single-size config',
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-size',
            minSize: 1000,
            maxSize: 5000,
          },
        },
        output: {},
      },
    },
    {
      name: 'should set all-in-one config',
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'all-in-one',
          },
        },
        output: {},
      },
    },
    {
      name: 'should set custom config',
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
        output: {},
      },
    },
    {
      name: 'should not split chunks when target is not',
      target: 'node',
    },
  ];

  it.each(cases)('$name', async item => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      getNormalizedConfig: () =>
        item.builderConfig || {
          performance: {
            chunkSplit: {
              strategy: 'split-by-experience',
            },
          },
          output: {},
        },
      context: {
        rootPath: __dirname,
      },
    };

    builderPluginSplitChunks().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, {
      target: item.target || 'web',
      isServer: item.target === 'node',
    });

    expect(chain.toConfig()).toMatchSnapshot();
  });
});
