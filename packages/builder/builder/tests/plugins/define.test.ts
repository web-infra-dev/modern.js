import { expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { CHAIN_ID } from '@modern-js/utils';
import { builderPluginDefine } from '@/plugins/define';

describe('plugins/define', () => {
  const cases = [
    {
      name: 'globalVars & define',
      builderConfig: {
        source: {
          globalVars: {
            'process.env.foo': 'foo',
            'import.meta.bar': {
              a: 'bar',
              b: false,
              c: { d: 42 },
            },
            'window.baz': [null, 'baz'],
          },
          define: {
            NAME: JSON.stringify('Jack'),
          },
        },
      },
    },
    {
      name: 'globalVars function',
      builderConfig: {
        source: {
          globalVars: (obj: any, { env, target }: any) => {
            obj.ENV = env;
            obj.TARGET = target;
          },
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
        ...item.builderConfig,
        output: shared.getDefaultOutputConfig(),
        source: {
          ...shared.getDefaultSourceConfig(),
          ...(item.builderConfig?.source || {}),
        },
      }),
      context: {
        rootPath: __dirname,
      },
    };

    builderPluginDefine().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, {
      CHAIN_ID,
      env: 'development',
      target: 'web',
      bundler: {
        DefinePlugin: class {
          params: any;

          constructor(params: any) {
            this.params = params;
          }
        },
      },
    });

    expect(chain.toConfig()).toMatchSnapshot();
  });
});
