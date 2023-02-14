import { expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { builderPluginBundleAnalyzer } from '@/plugins/bundleAnalyzer';

describe('plugins/bundleAnalyze', () => {
  it('should add bundle analyze plugin', async () => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      getNormalizedConfig: () => ({
        performance: {
          bundleAnalyze: {
            reportFilename: 'index$$.html',
          },
        },
      }),
      context: {},
    };
    builderPluginBundleAnalyzer().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, {
      CHAIN_ID: {
        PLUGIN: {
          BUNDLE_ANALYZER: 'bundle-analyze',
        },
      },
      target: 'web',
    });

    expect(chain.toConfig()).toMatchSnapshot();
  });
});
