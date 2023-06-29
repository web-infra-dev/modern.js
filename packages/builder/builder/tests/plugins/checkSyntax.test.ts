import { expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { CHAIN_ID } from '@modern-js/utils';
import { builderPluginCheckSyntax } from '@/plugins/checkSyntax';

describe('plugins/check-syntax', () => {
  it('should add check-syntax plugin properly', async () => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      getNormalizedConfig: () => ({
        security: {
          checkSyntax: true,
        },
      }),
      context: {
        rootPath: __dirname,
      },
    };

    builderPluginCheckSyntax().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, {
      CHAIN_ID,
      isProd: true,
      target: 'web',
    });

    expect(chain.toConfig()).toMatchSnapshot();
  });

  it('should not add check-syntax plugin when target node', async () => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      getNormalizedConfig: () => ({
        security: {
          checkSyntax: true,
        },
      }),
      context: {
        rootPath: __dirname,
      },
    };

    builderPluginCheckSyntax().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, {
      CHAIN_ID,
      isProd: true,
      target: 'node',
    });

    expect(chain.toConfig()).toMatchSnapshot();
  });

  it('should use default browserlist as targets when only set checksyntax.exclude', async () => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      getNormalizedConfig: () => ({
        security: {
          checkSyntax: {
            exclude: [/$.html/],
          },
        },
      }),
      context: {
        rootPath: __dirname,
      },
    };

    builderPluginCheckSyntax().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, {
      CHAIN_ID,
      isProd: true,
      target: 'web',
    });

    expect(chain.toConfig()).toMatchSnapshot();
  });
});
