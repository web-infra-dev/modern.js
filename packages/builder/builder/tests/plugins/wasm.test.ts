import * as shared from '@modern-js/builder-shared';
import { CHAIN_ID } from '@modern-js/utils';
import { expect, describe, it } from 'vitest';
import { builderPluginWasm } from '@/plugins/wasm';

describe('plugins/wasm', () => {
  it('should add wasm rule properly', async () => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      getNormalizedConfig: () => ({
        output: {
          distPath: {
            wasm: 'static/wasm',
          },
        },
      }),
    };

    builderPluginWasm().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, { CHAIN_ID });

    expect(chain.toConfig()).toMatchSnapshot();
  });
});
