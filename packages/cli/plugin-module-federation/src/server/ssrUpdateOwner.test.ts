import { afterEach, expect, it, rs } from '@rstest/core';
import { createSSRUpdateAdapter } from './ssrUpdate';
import { getSSRUpdateRegistration } from './ssrUpdateCandidates';
import { ownerOfSSRRuntime, releaseSSRUpdateOwner } from './ssrUpdateOwner';

const adapters: ReturnType<typeof createSSRUpdateAdapter>[] = [];
afterEach(() => {
  for (const adapter of adapters.splice(0))
    releaseSSRUpdateOwner(adapter.owner);
});
function create(build: string) {
  const adapter = createSSRUpdateAdapter({
    name: 'same-host',
    entries: ['index'],
  });
  adapters.push(adapter);
  const instance = {
    name: 'same-host',
    options: {
      id: `same-host:${build}`,
      remotes: [{ name: 'remote', entry: `${build}.js` }],
    },
    moduleCache: new Map(),
    destroy: rs.fn(async () => {}),
    updateRemotes: rs.fn(async (remotes: any[]) => {
      instance.options.remotes = remotes;
    }),
  };
  adapter.bindRuntime(instance);
  const application = {
    status: { phase: 'serving' },
    update: rs.fn(
      async (invalidate: () => Promise<void>, scope: () => unknown) => {
        scope();
        await invalidate();
        return 1;
      },
    ),
  };
  return { adapter, instance, application };
}
it('updates only the bound runtime when two hosts have the same name and different BuildIDs', async () => {
  const a = create('A');
  const b = create('B');
  await a.adapter.updateRemotes(a.application, [
    { name: 'remote', entry: 'A2.js' },
  ]);
  expect(a.instance.options.remotes[0].entry).toBe('A2.js');
  expect(b.instance.options.remotes[0].entry).toBe('B.js');
  expect(b.instance.updateRemotes).not.toHaveBeenCalled();
  expect(b.application.update).not.toHaveBeenCalled();
  expect(getSSRUpdateRegistration(a.adapter.owner.id, 'remote')?.entry).toBe(
    'A2.js',
  );
  expect(
    getSSRUpdateRegistration(b.adapter.owner.id, 'remote'),
  ).toBeUndefined();
  await a.adapter.dispose();
  expect(a.instance.destroy).toHaveBeenCalledTimes(1);
  expect(b.instance.destroy).not.toHaveBeenCalled();
  expect(a.adapter.owner.registrations?.[0].entry).toBe('A2.js');
  expect(b.adapter.owner.registrations).toBeUndefined();
  expect(() => b.adapter.bindRuntime(a.instance)).toThrow(
    'another SSR application',
  );
});
it('registers compiled roots through the owned context and shares ownership across Rspack require facades', () => {
  const a = create('A');
  const b = create('B');
  const context: any = { federation: { instance: a.instance } };
  const facade = () =>
    new Proxy(() => {}, {
      get: (_, property) => context[property],
      set: (_, property, value) => {
        context[property] = value;
        return true;
      },
    });
  const runtime = facade();
  const record = {
    application: 'same-host',
    entry: 'index',
    owner: 'index',
    runtime,
  };
  const register = () =>
    (globalThis as any)[Symbol.for('modern-js.mf.ssr.owners')].registerEntry(
      record,
    );
  a.adapter.run(register);
  expect(a.adapter.owner.entries.get('index')).toBe(record);
  expect((record as any).buildId).toBe('same-host:A');
  expect(ownerOfSSRRuntime(facade())).toBe(a.adapter.owner);
  expect(b.adapter.owner.entries.size).toBe(0);
  expect(() => b.adapter.run(register)).toThrow('another application');
  a.adapter.run(() =>
    (globalThis as any)[Symbol.for('modern-js.mf.ssr.owners')].registerEntry({
      ...record,
      entry: 'remoteEntry',
      runtime: {},
    }),
  );
  expect(a.adapter.owner.entries.size).toBe(1);
});

it('disposes a replaced provider after invalidation removes its registry and module references', async () => {
  const { adapter, instance, application } = create('A');
  const provider = {
    name: 'catalog',
    options: { id: 'catalog:v1' },
    shareScopeMap: {},
    moduleCache: new Map(),
    destroy: rs.fn(async () => {}),
  };
  instance.moduleCache.set('remote', {
    remoteInfo: {
      name: 'remote',
      providerName: 'catalog',
      buildVersion: 'v1',
      entryGlobalName: 'catalog',
    },
  });
  const previous = (globalThis as any).__FEDERATION__;
  (globalThis as any).__FEDERATION__ = {
    __INSTANCES__: [instance, provider],
    __SHARE__: {},
  };
  instance.updateRemotes.mockImplementation(async remotes => {
    instance.options.remotes = remotes;
    instance.moduleCache.clear();
    (globalThis as any).__FEDERATION__.__INSTANCES__ = [instance];
  });
  try {
    await adapter.updateRemotes(application, [
      { name: 'remote', entry: 'v2.js' },
    ]);
    await adapter.dispose();
    expect(provider.destroy).toHaveBeenCalledTimes(1);
  } finally {
    (globalThis as any).__FEDERATION__ = previous;
  }
});

it('disposes the selected provider build without retaining it for another build with the same name', async () => {
  const a = create('A');
  const b = create('B');
  const provider = (build: string) => ({
    name: 'catalog',
    options: { id: `catalog:${build}` },
    moduleCache: new Map(),
    shareScopeMap: {},
    destroy: rs.fn(async () => {}),
  });
  const first = provider('v1');
  const second = provider('v2');
  first.shareScopeMap = {
    default: {
      library: {
        '1.0.0': { from: 'catalog', useIn: ['same-host'], loaded: true },
      },
    },
  };
  second.shareScopeMap = {
    default: {
      library: {
        '1.0.0': { from: 'catalog', useIn: ['same-host'], loaded: true },
      },
    },
  };
  (b.instance as any).shareScopeMap = second.shareScopeMap;
  const info = (build: string) => ({
    name: 'remote',
    providerName: 'catalog',
    entryGlobalName: 'catalog',
    buildVersion: build,
  });
  a.instance.moduleCache.set('remote', { remoteInfo: info('v1') });
  b.instance.moduleCache.set('remote', { remoteInfo: info('v2') });
  const previous = (globalThis as any).__FEDERATION__;
  (globalThis as any).__FEDERATION__ = {
    __INSTANCES__: [a.instance, b.instance, first, second],
    __SHARE__: {
      'catalog:v1': first.shareScopeMap,
      'catalog:v2': second.shareScopeMap,
    },
  };
  try {
    await a.adapter.dispose();
    expect(first.destroy).toHaveBeenCalledTimes(1);
    expect(second.destroy).not.toHaveBeenCalled();
    expect(b.instance.destroy).not.toHaveBeenCalled();
  } finally {
    (globalThis as any).__FEDERATION__ = previous;
  }
});

it('retains an exact provider shared record owned by another same-name host without a loaded remote module', async () => {
  const a = create('A');
  const b = create('B');
  const shared = { from: 'catalog', useIn: ['same-host'], loaded: true };
  const scope = { default: { library: { '1.0.0': shared } } };
  const provider = {
    name: 'catalog',
    options: { id: 'catalog:v1' },
    moduleCache: new Map(),
    shareScopeMap: scope,
    destroy: rs.fn(async () => {}),
  };
  (b.instance as any).shareScopeMap = scope;
  (b.instance as any).disposed = true; // Closing owners still retain their roots until removed from the registry.
  a.instance.moduleCache.set('remote', {
    remoteInfo: { name: 'remote', providerName: 'catalog', buildVersion: 'v1' },
  });
  const previous = (globalThis as any).__FEDERATION__;
  (globalThis as any).__FEDERATION__ = {
    __INSTANCES__: [a.instance, b.instance, provider],
    __SHARE__: { 'catalog:v1': scope },
  };
  try {
    await a.adapter.dispose();
    expect(provider.destroy).not.toHaveBeenCalled();
    expect(b.instance.destroy).not.toHaveBeenCalled();
    expect(shared.useIn).toEqual(['same-host']);
  } finally {
    (globalThis as any).__FEDERATION__ = previous;
  }
});

it('propagates retained provider ownership through nested providers absent from the global registry', async () => {
  const a = create('A');
  const b = create('B');
  const provider = (name: string) => ({
    name,
    options: { id: `${name}:v1` },
    moduleCache: new Map(),
    shareScopeMap: {},
    destroy: rs.fn(async () => {}),
  });
  const p = provider('provider-p');
  const q = provider('provider-q');
  const module = (name: string) => ({
    remoteInfo: { name, providerName: name, buildVersion: 'v1' },
  });
  q.moduleCache.set('p', module(p.name));
  b.instance.moduleCache.set('q', module(q.name));
  // p is visited first and has already left the global registry, but its real
  // runtime is still retained by the application being updated.
  (a.instance as any).retainedProviders = new Set([p, q]);
  const previous = (globalThis as any).__FEDERATION__;
  (globalThis as any).__FEDERATION__ = {
    __INSTANCES__: [a.instance, b.instance, q],
    __SHARE__: {},
  };
  try {
    await a.adapter.dispose();
    expect(a.instance.destroy).toHaveBeenCalledTimes(1);
    expect(q.destroy).not.toHaveBeenCalled();
    expect(p.destroy).not.toHaveBeenCalled();
    expect(b.instance.destroy).not.toHaveBeenCalled();
  } finally {
    (globalThis as any).__FEDERATION__ = previous;
  }
});

it('disposes the transitive container graph even when only its root is directly cached', async () => {
  const a = create('A');
  const nested = {
    name: 'nested',
    options: { id: 'nested:v1' },
    moduleCache: new Map(),
    shareScopeMap: {},
    destroy: rs.fn(async () => {}),
  };
  const direct = {
    name: 'direct',
    options: { id: 'direct:v1' },
    moduleCache: new Map([
      [
        'nested',
        {
          remoteInfo: {
            name: 'nested',
            providerName: 'nested',
            buildVersion: 'v1',
          },
        },
      ],
    ]),
    shareScopeMap: {},
    destroy: rs.fn(async () => {}),
  };
  a.instance.moduleCache.set('direct', {
    remoteInfo: { name: 'direct', providerName: 'direct', buildVersion: 'v1' },
  });
  const previous = (globalThis as any).__FEDERATION__;
  (globalThis as any).__FEDERATION__ = {
    __INSTANCES__: [a.instance, direct, nested],
    __SHARE__: {},
  };
  try {
    await a.adapter.dispose();
    expect(direct.destroy).toHaveBeenCalledTimes(1);
    expect(nested.destroy).toHaveBeenCalledTimes(1);
  } finally {
    (globalThis as any).__FEDERATION__ = previous;
  }
});
