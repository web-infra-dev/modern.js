import { join } from 'path';
import { vi, expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { builderPluginCache } from '@/plugins/cache';

vi.mock('@modern-js/utils', async importOriginal => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    findExists: (files: string[]) => {
      if (files.some(file => file.includes('tailwind'))) {
        return '/root/tailwind.config.ts';
      }
      return mod.findExists(files);
    },
  };
});

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
      name: 'should apply cacheDigest',
      builderConfig: {
        performance: {
          buildCache: {
            cacheDigest: ['a', 'b', 'c'],
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
