import { type AppToolsExtendHooks, appTools } from '../../src';

function createHook() {
  return appTools().registryHooks!
    .modifyBuilderEnvironments as AppToolsExtendHooks['modifyBuilderEnvironments'];
}

describe('modifyBuilderEnvironments hook', () => {
  it('preserves the environments map when there are no taps', async () => {
    const hook = createHook();
    const environments = { web: {} };
    const result = await hook.call({ environments });
    expect(result.environments).toBe(environments);
  });

  it('preserves the environments map when a tap returns undefined', async () => {
    const hook = createHook();
    hook.tap(() => undefined as any);
    const environments = { web: {} };
    const result = await hook.call({ environments });
    expect(result.environments).toBe(environments);
  });

  it('passes the transformed environments map to the next tap', async () => {
    const hook = createHook();
    hook.tap(({ environments }) => ({
      environments: {
        ...environments,
        Worker: { output: { target: 'web-worker' } },
      },
    }));
    hook.tap(({ environments }) => {
      expect(environments.Worker.output?.target).toBe('web-worker');
      return { environments };
    });
    const { environments } = await hook.call({ environments: { web: {} } });
    expect(Object.keys(environments)).toEqual(['web', 'Worker']);
  });
});
