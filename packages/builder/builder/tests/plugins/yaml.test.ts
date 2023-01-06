import { expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { CHAIN_ID } from '@modern-js/utils';
import { PluginYaml } from '@/plugins/yaml';

describe('plugins/yaml', () => {
  it('should add yaml rule properly', async () => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
    };

    PluginYaml().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, { CHAIN_ID });

    expect(chain.toConfig()).toMatchSnapshot();
  });
});
