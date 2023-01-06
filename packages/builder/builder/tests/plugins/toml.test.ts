import { expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { CHAIN_ID } from '@modern-js/utils';
import { PluginToml } from '@/plugins/toml';

describe('plugins/toml', () => {
  it('should add toml rule properly', async () => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
    };

    PluginToml().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, { CHAIN_ID });

    expect(chain.toConfig()).toMatchSnapshot();
  });
});
