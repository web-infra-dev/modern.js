import { vi, expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { PluginTarget } from '@/plugins/target';

describe('plugins/target', () => {
  const cases = [
    {
      target: 'node',
      browserslist: ['foo'],
      expected: { target: 'node' },
    },
    {
      target: 'modern-web',
      browserslist: ['foo'],
      expected: { target: ['web', 'browserslist'] },
    },
    {
      target: 'modern-web',
      browserslist: null,
      expected: { target: ['web', 'es2015'] },
    },
    {
      target: 'web',
      browserslist: null,
      expected: { target: ['web', 'es5'] },
    },
    {
      target: 'web-worker',
      browserslist: null,
      expected: { target: ['webworker', 'es5'] },
    },
  ];

  it.each(cases)('%j', async item => {
    const $getBrowserslist = vi
      .spyOn(shared, 'getBrowserslist')
      .mockResolvedValueOnce(item.browserslist);

    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      context: {},
    };

    PluginTarget().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, { target: item.target });

    expect(chain.toConfig()).toEqual(item.expected);
    $getBrowserslist.mockRestore();
  });
});
