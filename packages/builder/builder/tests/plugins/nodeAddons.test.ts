import { expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { CHAIN_ID } from '@modern-js/utils';
import { builderPluginNodeAddons } from '@/plugins/nodeAddons';

describe('plugins/nodeAddons', () => {
  it('should add node addons rule properly', async () => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
    };

    builderPluginNodeAddons().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, { isServer: true, CHAIN_ID });

    expect(chain.toConfig()).toMatchSnapshot();
  });
});
