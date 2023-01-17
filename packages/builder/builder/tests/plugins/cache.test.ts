import { join } from 'path';
import { expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { builderPluginCache } from '@/plugins/cache';

describe('plugins/cache', () => {
  const cases = [
    {
      name: 'should add cache config correctly',
    },
    {
      name: 'should watch framework config change',
      context: {
        configPath: '/path/to/config.js',
      },
    },
    {
      name: 'should watch tsconfig change',
      context: {
        tsconfigPath: '/path/to/tsconfig.json',
      },
    },
    {
      name: 'should custom cache directory by user',
      builderConfig: {
        performance: {
          buildCache: {
            cacheDirectory: './node_modules/.cache/tmp',
          },
        },
      },
    },
    {
      name: 'should disable cache',
      builderConfig: {
        performance: {
          buildCache: false,
        },
      },
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
            buildCache: true,
          },
        },
      context: {
        rootPath: __dirname,
        cachePath: join(__dirname, 'node_modules', '.cache'),
        bundlerType: 'webpack',

        ...(item.context || {}),
      },
    };

    builderPluginCache().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, {
      target: 'web',
      env: 'development',
    });

    expect(chain.toConfig()).toMatchSnapshot();
  });
});
