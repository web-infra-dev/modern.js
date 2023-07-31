import { expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { builderPluginNetworkPerformance } from '@/plugins/networkPerformance';

describe('plugins/builderPluginNetworkPerformance', () => {
  it('should add network performance plugin', async () => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      getNormalizedConfig: () => ({
        performance: {
          preconnect: 'http://aaa.com',
          dnsPrefetch: 'http://aaa.com',
        },
      }),
      context: {},
    };
    builderPluginNetworkPerformance().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, {
      CHAIN_ID: {
        PLUGIN: {
          HTML_PRECONNECT: 'HTML_PRECONNECT',
          HTML_DNS_PREFETCH: 'HTML_DNS_PREFETCH',
        },
      },
      HtmlPlugin: {
        name: 'HtmlPlugin',
      },
      target: 'web',
    });

    expect(chain.toConfig()).toMatchSnapshot();
  });

  it('should not add network performance plugin when target is server', async () => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      getNormalizedConfig: () => ({
        performance: {
          preconnect: 'http://aaa.com',
          dnsPrefetch: 'http://aaa.com',
        },
      }),
      context: {},
    };
    builderPluginNetworkPerformance().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, {
      CHAIN_ID: {
        PLUGIN: {
          HTML_PRECONNECT: 'HTML_PRECONNECT',
          HTML_DNS_PREFETCH: 'HTML_DNS_PREFETCH',
        },
      },
      HtmlPlugin: {
        name: 'HtmlPlugin',
      },
      isServer: true,
      target: 'web',
    });

    expect(chain.toConfig()).toMatchInlineSnapshot('{}');
  });

  it('should not add network performance plugin by default', async () => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      getNormalizedConfig: () => ({
        performance: {},
      }),
      context: {},
    };
    builderPluginNetworkPerformance().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, {
      CHAIN_ID: {
        PLUGIN: {
          HTML_PRECONNECT: 'HTML_PRECONNECT',
          HTML_DNS_PREFETCH: 'HTML_DNS_PREFETCH',
        },
      },
      HtmlPlugin: {
        name: 'HtmlPlugin',
      },
      isServer: true,
      target: 'web',
    });

    expect(chain.toConfig()).toMatchInlineSnapshot('{}');
  });
});
