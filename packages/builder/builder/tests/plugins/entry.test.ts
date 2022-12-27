import { expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { PluginEntry } from '@/plugins/entry';

describe('plugins/entry', () => {
  const cases = [
    {
      name: 'should set entry correctly',
      entry: {
        main: './src/main.ts',
      },
      preEntry: [],
      expected: {
        entry: {
          main: ['./src/main.ts'],
        },
      },
    },
    {
      name: 'should set multiple entry correctly',
      entry: {
        foo: ['./src/polyfill.ts', './src/foo.ts'],
        bar: ['./src/polyfill.ts', './src/bar.ts'],
      },
      preEntry: [],
      expected: {
        entry: {
          bar: ['./src/polyfill.ts', './src/bar.ts'],
          foo: ['./src/polyfill.ts', './src/foo.ts'],
        },
      },
    },
    {
      name: 'should set pre-entry correctly',
      entry: {
        foo: ['./src/polyfill.ts', './src/foo.ts'],
        bar: './src/bar.ts',
      },
      preEntry: ['./src/pre-entry.ts'],
      expected: {
        entry: {
          bar: ['./src/pre-entry.ts', './src/bar.ts'],
          foo: ['./src/pre-entry.ts', './src/polyfill.ts', './src/foo.ts'],
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
      getNormalizedConfig: () => ({
        source: {
          preEntry: item.preEntry,
        },
      }),
      context: {
        entry: item.entry,
      },
    };

    PluginEntry().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain);

    expect(chain.toConfig()).toEqual(item.expected);
  });
});
