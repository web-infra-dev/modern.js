import { vi, test, expect, describe, SpyInstance } from 'vitest';
import { getBrowserslist, getBundlerChain } from '@modern-js/builder-shared';
import { builderPluginTarget } from '@/plugins/target';

vi.mock('@modern-js/builder-shared', async importOriginal => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    getBrowserslist: vi.fn(),
  };
});

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

  test.each(cases)('%j', async item => {
    (getBrowserslist as unknown as SpyInstance).mockResolvedValueOnce(
      item.browserslist,
    );

    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      context: {},
    };

    builderPluginTarget().setup(api);

    const chain = await getBundlerChain();

    await modifyBundlerChainCb(chain, { target: item.target });

    expect(chain.toConfig()).toEqual(item.expected);
  });
});
