import { createAsyncHook } from '@modern-js/plugin';
import { appTools } from '../../src';
import type { ModifyBuilderEnvironmentsFn } from '../../src/types/plugin';

describe('modifyBuilderEnvironments hook', () => {
  it('is registered on the app-tools registryHooks', () => {
    const plugin = appTools();
    expect(plugin.registryHooks?.modifyBuilderEnvironments).toBeDefined();
  });

  it('identity default: with no taps, environments is byte-identical (same ref)', async () => {
    const hook = createAsyncHook<ModifyBuilderEnvironmentsFn>();
    const environments = { web: { output: { target: 'web' } } } as any;
    const { environments: out } = await hook.call({ environments });
    expect(out).toBe(environments);
  });

  it('a tap returning undefined leaves environments untouched', async () => {
    const hook = createAsyncHook<ModifyBuilderEnvironmentsFn>();
    hook.tap(() => undefined as any);
    const environments = { web: {} } as any;
    const { environments: out } = await hook.call({ environments });
    expect(out).toBe(environments);
  });

  it('a transform replaces the environments map and chains to the next tap', async () => {
    const hook = createAsyncHook<ModifyBuilderEnvironmentsFn>();
    hook.tap(({ environments }) => ({
      environments: {
        ...environments,
        Worker: { output: { target: 'web-worker' } } as any,
      },
    }));
    hook.tap(({ environments }) => {
      // the second tap sees the first tap's output
      expect(environments.Worker).toBeDefined();
      return { environments };
    });
    const { environments: out } = await hook.call({
      environments: { web: {} } as any,
    });
    expect(Object.keys(out)).toEqual(['web', 'Worker']);
  });
});
