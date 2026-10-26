import { describe, expect, it, rs } from '@rstest/core';
import { TreeShakingSharedPlugin } from '@module-federation/enhanced/rspack';
import { moduleFederationPlugin } from './plugin';

// Keep the legacy switch and its exclusion of the standard SSR runtime path.
describe('secondary shared tree shaking compatibility', () => {
  it('retains browser/server tree-shaking plugins and skips ordinary SSR runtime injection', async () => {
    const plugin = moduleFederationPlugin({
      config: { name: 'secondary', dts: false },
      ssr: true,
      secondarySharedTreeShaking: true,
    });
    const callbacks: Array<(chain: any) => void> = [];
    let runtimeCallback: any;
    const api = {
      getConfig: () => ({ server: { ssr: true } }),
      modifyBundlerChain: (callback: (chain: any) => void) =>
        callbacks.push(callback),
      config: rs.fn(),
      _internalServerPlugins: rs.fn(),
      _internalRuntimePlugins: (callback: any) => {
        runtimeCallback = callback;
      },
      onAfterBuild: rs.fn(),
      onDevCompileDone: rs.fn(),
    } as any;
    await plugin.usePlugins![0].setup!(api);
    await plugin.setup!(api);
    await plugin.usePlugins![1].setup!(api);
    for (const [target, callback] of [
      ['web', callbacks[1]],
      ['node', callbacks[2]],
    ] as const) {
      const use = rs.fn();
      const chain = {
        get: () => target,
        plugins: { has: () => false },
        plugin: () => ({ use }),
      };
      callback(chain);
      expect(use).toHaveBeenCalledWith(TreeShakingSharedPlugin, [
        { mfConfig: { name: 'secondary', dts: false }, secondary: true },
      ]);
    }
    const runtime = { entrypoint: {}, plugins: [] };
    expect(runtimeCallback(runtime)).toEqual(runtime);
    expect(runtime.plugins).toEqual([]);
  });
});
