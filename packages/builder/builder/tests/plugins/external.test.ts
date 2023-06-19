import { describe, it, expect } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { builderPluginExternals } from '@/plugins/externals';

describe('plugins/external', () => {
  it('should add external config', async () => {
    let modifyBundlerChainCb: any;
    let onBeforeCreateCompilerCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      getNormalizedConfig: () => ({
        output: {
          externals: ['react', /@swc\/.*/],
        },
      }),
      onBeforeCreateCompiler: (fn: any) => {
        onBeforeCreateCompilerCb = fn;
      },
    };

    builderPluginExternals().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain);

    const bundlerConfigs = [
      {
        ...chain.toConfig(),
        target: 'web',
      },
      {
        ...chain.toConfig(),
        target: 'webworker',
      },
    ];

    onBeforeCreateCompilerCb({ bundlerConfigs });

    expect(bundlerConfigs[0].externals).toEqual(['react', /@swc\/.*/]);
    expect(bundlerConfigs[1].externals).toBeUndefined();
  });
});
