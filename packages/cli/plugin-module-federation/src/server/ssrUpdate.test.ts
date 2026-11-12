import { createSSRUpdateOwner } from './ssrUpdateOwner';
import { AsyncLocalStorage } from 'node:async_hooks';
import { afterEach, describe, expect, it } from '@rstest/core';
import { createSSRUpdateAdapter } from './ssrUpdate';

const key = Symbol.for('modern-js.mf.ssr.entries');
const stateKey = Symbol.for('modern-js.mf.ssr.consumption');
const previous = (globalThis as any)[key];
afterEach(() => {
  (globalThis as any)[key] = previous;
});
function fixture() {
  const owner = createSSRUpdateOwner('host');
  const state = { dynamic: false, context: new AsyncLocalStorage() };
  const runtime = {
    federation: { instance: { [stateKey]: state } },
    remotesLoadingData: {
      remoteKeyToRemoteModuleIds: { remote: [1] },
      remoteModuleIdToConsumerModuleIds: { 1: [2] },
      consumerModuleIdToParentModuleIds: { 2: [3] },
    },
  };
  const a = {
    application: 'host',
    entry: 'a',
    owner: 'a',
    rootIds: [3],
    remoteNames: ['remote'],
    reasons: [],
    chunks: [10],
    runtime,
    load: () => ({}),
  };
  const b = { ...a, entry: 'b', owner: 'b', remoteNames: [], rootIds: [4] };
  const unrelated = {
    ...a,
    application: 'host:other',
    entry: 'unknown',
    owner: 'unknown',
  };
  (globalThis as any)[key] = new Map(
    [a, b, unrelated].map(record => [
      JSON.stringify([record.application, record.entry]),
      record,
    ]),
  );
  owner.entries.set(a.entry, a);
  owner.entries.set(b.entry, b);
  return {
    owner,
    state,
    runtime,
    a,
    b,
    adapter: createSSRUpdateAdapter({
      name: 'host',
      owner,
      entries: ['a', 'b'],
      staticOnly: true,
    }),
  };
}
describe('SSR static scope proof', () => {
  it('expands across a shared runtime and isolates application names containing separators', () => {
    const { adapter } = fixture();
    expect(adapter.plan('remote')).toEqual({
      mode: 'entries',
      entries: ['a', 'b'],
      reasons: [],
    });
  });
  it('falls back even when a chunk exists if the native parent closure cannot reach its entry', () => {
    const { adapter, runtime } = fixture();
    runtime.remotesLoadingData.consumerModuleIdToParentModuleIds[2] = [];
    expect(adapter.plan('remote')).toEqual({
      mode: 'application',
      reasons: ['incomplete-parent-closure'],
    });
  });
  it('requires the complete entry inventory and explicit static-only contract', () => {
    const { owner } = fixture();
    expect(
      createSSRUpdateAdapter({
        name: 'host',
        owner,
        entries: ['a', 'missing'],
        staticOnly: true,
      }).plan('remote').reasons,
    ).toContain('missing-entry-metadata');
    expect(
      createSSRUpdateAdapter({ name: 'host', owner, entries: ['a', 'b'] }).plan(
        'remote',
      ).reasons,
    ).toContain('dynamic-or-mixed-consumption');
  });
  it('invalidates the proof on runtime consumption and unknown remote names', () => {
    const { adapter, state } = fixture();
    state.dynamic = true;
    expect(adapter.plan('remote').reasons).toContain(
      'runtime-consumption-observed',
    );
    expect(adapter.plan('new-remote').reasons).toContain(
      'remote-not-in-static-graph',
    );
  });
});

describe('SSR replacement recovery', () => {
  it('honors a resource owner widening the update before invalidation', async () => {
    const { adapter, runtime, state } = fixture();
    const instance = runtime.federation.instance as any;
    instance.options = { remotes: [{ name: 'remote', entry: 'v1' }] };
    instance.updateRemotes = async (remotes: any[]) => {
      expect((state as any).selective).toBe(false);
      instance.options.remotes = remotes;
    };
    const application = {
      status: { phase: 'serving' },
      async update(
        invalidate: (entries?: readonly string[]) => Promise<void>,
        scope?: () => readonly string[] | undefined,
      ) {
        expect(scope?.()).toEqual(['a', 'b']);
        await invalidate(undefined);
        return 1;
      },
    };
    expect(
      await adapter.updateRemotes(application, [
        { name: 'remote', entry: 'v2' },
      ]),
    ).toMatchObject({
      mode: 'application',
      reasons: ['application-scope-required'],
      generation: 1,
    });
  });

  it('automatically rebuilds once when selective entry preparation fails', async () => {
    const { adapter, runtime } = fixture();
    const instance = runtime.federation.instance as any;
    instance.options = { remotes: [{ name: 'remote', entry: 'v1' }] };
    instance.updateRemotes = async (remotes: any[]) => {
      instance.options.remotes = remotes;
    };
    const scopes: (readonly string[] | undefined)[] = [];
    const application = {
      status: { phase: 'serving' },
      async update(
        invalidate: (entries?: readonly string[]) => Promise<void>,
        scope?: () => readonly string[] | undefined,
      ) {
        const requested = scope?.();
        const entries =
          this.status.phase === 'unavailable' ? undefined : requested;
        scopes.push(entries);
        await invalidate(entries);
        if (entries) {
          this.status.phase = 'unavailable';
          throw new Error('Cannot synchronize SSR entry startup exports');
        }
        this.status.phase = 'serving';
        return 1;
      },
    };
    expect(
      await adapter.updateRemotes(application, [
        { name: 'remote', entry: 'v2' },
      ]),
    ).toMatchObject({
      mode: 'application',
      reasons: ['failed-update-recovery'],
      generation: 1,
    });
    expect(scopes).toEqual([['a', 'b'], undefined]);
    expect(instance.options.remotes).toEqual([
      { name: 'remote', entry: 'v2', alias: undefined },
    ]);
  });

  it('publishes a batch once and includes a previously failed target in whole-application recovery', async () => {
    const { adapter, runtime } = fixture();
    const instance = runtime.federation.instance as any;
    instance.options = {
      remotes: [
        { name: 'remote', entry: 'v1' },
        { name: 'new-a', entry: 'a1' },
        { name: 'new-b', entry: 'b1' },
      ],
    };
    let fail = true;
    const batches: any[][] = [];
    instance.updateRemotes = async (remotes: any[]) => {
      batches.push(remotes);
      instance.options.remotes = instance.options.remotes.filter(
        (remote: any) => remote.name !== 'remote',
      );
      if (fail) throw new Error('partial mutation');
      instance.options.remotes = remotes;
    };
    let publications = 0;
    const application = {
      status: { phase: 'serving' },
      async update(
        invalidate: (entries?: readonly string[]) => Promise<void>,
        scope?: () => readonly string[] | undefined,
      ) {
        const entries = scope?.();
        try {
          await invalidate(
            this.status.phase === 'unavailable' ? undefined : entries,
          );
        } catch (error) {
          this.status.phase = 'unavailable';
          throw error;
        }
        this.status.phase = 'serving';
        return ++publications;
      },
    };
    await expect(
      adapter.update(application, 'remote', { entry: 'v2' }, { revision: 1 }),
    ).rejects.toThrow('SSR update and application recovery failed');
    expect(adapter.status(application)).toMatchObject({
      mutationStarted: true,
      application: { phase: 'unavailable' },
    });
    fail = false;
    const result = await adapter.updateRemotes(
      application,
      [
        { name: 'new-a', entry: 'a' },
        { name: 'new-b', entry: 'b' },
      ],
      { revision: 2 },
    );
    expect(result).toMatchObject({
      mode: 'application',
      reasons: ['failed-update-recovery'],
      generation: 1,
    });
    expect(batches[2].map(({ name, entry }) => [name, entry])).toEqual([
      ['remote', 'v2'],
      ['new-a', 'a'],
      ['new-b', 'b'],
    ]);
    expect(publications).toBe(1);
  });

  it('deduplicates pending and applied revisions and rejects stale or conflicting messages', async () => {
    const { adapter, runtime } = fixture();
    const instance = runtime.federation.instance as any;
    instance.options = { remotes: [{ name: 'remote', entry: 'v1' }] };
    instance.updateRemotes = async (remotes: any[]) => {
      instance.options.remotes = remotes;
    };
    instance[stateKey].context = new AsyncLocalStorage();
    let release!: () => void;
    const barrier = new Promise<void>(resolve => {
      release = resolve;
    });
    let publications = 0;
    const application = {
      async update(
        invalidate: (entries?: readonly string[]) => Promise<void>,
        scope?: () => readonly string[] | undefined,
      ) {
        const entries = scope?.();
        await barrier;
        await invalidate(entries);
        return ++publications;
      },
    };
    const first = adapter.update(
      application,
      'remote',
      { entry: 'v2' },
      { revision: 2 },
    );
    expect(
      adapter.update(application, 'remote', { entry: 'v2' }, { revision: 2 }),
    ).toBe(first);
    expect(adapter.status(application)).toMatchObject({
      phase: 'pending',
      revision: 2,
    });
    await expect(
      adapter.update(application, 'remote', { entry: 'v1' }, { revision: 1 }),
    ).rejects.toThrow('Stale');
    await expect(
      adapter.update(
        application,
        'remote',
        { entry: 'other' },
        { revision: 2 },
      ),
    ).rejects.toThrow('different replacement');
    release();
    expect(await first).toMatchObject({ generation: 1, revision: 2 });
    await adapter.update(
      application,
      'remote',
      { entry: 'v2' },
      { revision: 2 },
    );
    expect(publications).toBe(1);
    expect(adapter.status(application)).toMatchObject({
      phase: 'applied',
      appliedRevision: 2,
    });
    await adapter.update(
      application,
      'remote',
      { entry: 'v1' },
      { revision: 3 },
    );
    expect(publications).toBe(2);
    expect(instance.options.remotes[0].entry).toBe('v1');
  });

  it('keeps appliedRevision unchanged on failure and retries the same revision explicitly', async () => {
    const { adapter } = fixture();
    let fail = true;
    let attempts = 0;
    const application = {
      async update() {
        attempts++;
        if (fail) throw new Error('load failed');
        return 1;
      },
    };
    await expect(
      adapter.update(application, 'remote', { entry: 'v2' }, { revision: 7 }),
    ).rejects.toThrow('load failed');
    expect(adapter.status(application)).toMatchObject({
      revision: 7,
      phase: 'failed',
      appliedRevision: undefined,
    });
    fail = false;
    await adapter.update(
      application,
      'remote',
      { entry: 'v2' },
      { revision: 7 },
    );
    expect(attempts).toBe(2);
    expect(adapter.status(application)).toMatchObject({
      appliedRevision: 7,
      phase: 'applied',
    });
  });

  it('publishes paired public targets once across alias changes and reports failure stages', async () => {
    const { runtime, owner } = fixture();
    const instance = runtime.federation.instance as any;
    instance.options = {
      remotes: [{ name: 'remote', alias: 'alias', entry: 'private-v1' }],
    };
    instance.updateRemotes = async (remotes: any[]) => {
      instance.options.remotes = remotes;
    };
    const adapter = createSSRUpdateAdapter({
      name: 'host',
      owner,
      entries: ['a', 'b'],
      hydration: {
        remotes: [{ name: 'remote', entry: 'https://cdn.test/v1.json' }],
      },
    });
    let fail = false;
    let generation = 0;
    const application = {
      async update(
        invalidate: () => Promise<void>,
        scope?: () => readonly string[] | undefined,
      ) {
        scope?.();
        await invalidate();
        if (fail) throw new Error('candidate validation failed');
        return ++generation;
      },
    };
    const resources = { templates: { a: '<html><head></head></html>' } };
    adapter.prepareResources(resources);
    const old = resources.templates.a;
    await adapter.update(application, 'alias', {
      entry: 'private-v2',
      client: { entry: 'https://cdn.test/v2.json' },
    });
    const result = await adapter.update(application, 'remote', {
      entry: 'private-v3',
      client: { entry: 'https://cdn.test/v3.json' },
    });
    adapter.prepareResources(resources);
    expect(old).toContain('v1.json');
    expect(resources.templates.a).toContain('v3.json');
    expect(resources.templates.a).not.toContain('v2.json');
    expect(resources.templates.a).not.toContain('private');
    expect(instance.options.remotes[0]).not.toHaveProperty('client');
    expect(Object.keys(result.timingsMs)).toEqual(
      expect.arrayContaining([
        'queue',
        'analyze',
        'drain',
        'clear',
        'rebuild',
        'total',
      ]),
    );
    expect(Object.values(result.timingsMs).every(value => value >= 0)).toBe(
      true,
    );
    fail = true;
    await expect(
      adapter.update(application, 'alias', {
        entry: 'private-v4',
        client: { entry: 'https://cdn.test/v4.json' },
      }),
    ).rejects.toMatchObject({
      failedStage: 'rebuild',
      appliedRevision: 2,
      mutationStarted: true,
    });
    expect(adapter.status(application)).toMatchObject({
      phase: 'failed',
      stage: 'failed',
      appliedRevision: 2,
    });
  });

  it('remembers each instance registration when a replacement fails after removal', async () => {
    const { runtime, adapter } = fixture();
    let fail = true;
    const instance = Object.assign(runtime.federation.instance, {
      options: { remotes: [{ name: 'remote', entry: 'v1', alias: 'alias' }] },
      removeRemote() {
        this.options.remotes = [];
      },
      async updateRemotes(remotes: any[]) {
        this.removeRemote();
        if (fail) {
          fail = false;
          throw new Error('registration failed');
        }
        this.options.remotes = remotes;
      },
    });
    Object.assign(instance[stateKey], { context: new AsyncLocalStorage() });
    let failed = false;
    const application = {
      async update(
        invalidate: (entries?: readonly string[]) => Promise<void>,
        scope?: () => readonly string[] | undefined,
      ) {
        const entries = scope?.();
        try {
          await invalidate(failed ? undefined : entries);
        } catch (error) {
          failed = true;
          throw error;
        }
        return 1;
      },
    };
    await expect(
      adapter.update(application, 'remote', { entry: 'v2' }),
    ).rejects.toThrow('SSR remote replacement failed');
    expect(instance.options.remotes).toEqual([]);
    expect(
      await adapter.update(application, 'remote', { entry: 'v3' }),
    ).toMatchObject({
      mode: 'application',
      reasons: ['application-scope-required'],
    });
    expect(instance.options.remotes).toEqual([
      { name: 'remote', entry: 'v3', alias: 'alias' },
    ]);
    let mutated = false;
    await expect(
      adapter.update(
        {
          async update(invalidate, scope) {
            scope?.();
            mutated = true;
            await invalidate();
            return 2;
          },
        },
        'unknown',
        { entry: '' },
      ),
    ).rejects.toThrow('replacement entries are required');
    expect(mutated).toBe(false);
  });
});

// Formal async check/deferred/publication coverage lives in remoteUpdate.test.ts.
// adapter.update above retains the legacy PoC revision compatibility contract.
describe('registered update targets', () => {
  it('disposes the full graph for nested changes and dependency removal', async () => {
    const { adapter, runtime } = fixture();
    const instance = runtime.federation.instance as any;
    instance.options = {
      remotes: [{ name: 'provider', alias: 'remote', entry: 'v1' }],
    };
    instance.updateRemotes = async (remotes: any[]) => {
      expect(remotes[0]).not.toHaveProperty('dependencies');
      instance.options.remotes = remotes;
    };
    const scopes: (readonly string[] | undefined)[] = [];
    const application = {
      async update(
        invalidate: (scope?: readonly string[]) => Promise<void>,
        getScope?: () => readonly string[] | undefined,
      ) {
        const scope = getScope?.();
        scopes.push(scope);
        await invalidate(scope);
        return scopes.length;
      },
    };
    const remote = { name: 'remote', entry: 'v1' };
    const nested = { name: 'nested', entry: 'nested.json', buildVersion: '1' };
    for (const dependencies of [
      [nested],
      [{ ...nested, buildVersion: '2' }],
      [],
    ]) {
      expect(
        await adapter.updateRemotes(application, [{ ...remote, dependencies }]),
      ).toMatchObject({
        mode: 'application',
        reasons: ['transitive-remote-dependencies'],
      });
    }
    expect(scopes).toEqual([undefined, undefined, undefined]);
    // An empty graph no longer needs the nested-container fallback.
    expect(
      await adapter.updateRemotes(application, [
        { ...remote, entry: 'v2', dependencies: [] },
      ]),
    ).toMatchObject({ mode: 'entries' });
  });

  it('keeps declared aliases for selective planning and strips candidate information before Core mutation', async () => {
    const { adapter, runtime } = fixture();
    const instance = runtime.federation.instance as any;
    instance.options = {
      remotes: [{ name: 'provider', alias: 'remote', entry: 'v1' }],
    };
    instance.updateRemotes = async (remotes: any[]) => {
      expect(remotes[0]).not.toHaveProperty('moduleInfo');
      instance.options.remotes = remotes;
    };
    const application = {
      async update(
        invalidate: (scope?: readonly string[]) => Promise<void>,
        getScope?: () => readonly string[] | undefined,
      ) {
        const scope = getScope?.();
        expect(scope).toEqual(['a', 'b']);
        await invalidate(scope);
        return 1;
      },
    };
    const moduleInfo = { remoteEntry: 'v2.js', buildVersion: 'v2' };
    expect(
      await adapter.updateRemotes(application, [
        { name: 'remote', entry: 'v2', moduleInfo },
      ]),
    ).toMatchObject({ mode: 'entries', changed: true });
    await expect(
      adapter.shouldUpdateRemote(application, {
        name: 'provider',
        entry: 'v2',
        moduleInfo,
      }),
    ).resolves.toBe(false);
    await expect(
      adapter.updateRemotes(application, [
        { name: 'unregistered', entry: 'v2' },
      ]),
    ).rejects.toThrow('not registered');
  });
});

describe('whole application instance handoff', () => {
  it('leaves name-based shared ownership to Core when disposing a generation', async () => {
    const { adapter, runtime } = fixture();
    const host = runtime.federation.instance as any;
    host.name = 'host';
    host.options = { remotes: [{ name: 'remote', entry: 'v2' }] };
    const shared = { from: 'host', useIn: ['host', 'remote'] };
    const previousFederation = (globalThis as any).__FEDERATION__;
    (globalThis as any).__FEDERATION__ = {
      __INSTANCES__: [host],
      __SHARE__: { host: { default: { react: { '1': shared } } } },
    };
    host.destroy = async () => {
      expect(shared.useIn).toEqual(['host', 'remote']);
    };
    try {
      await adapter.dispose(['a']);
      expect(shared.useIn).toEqual(['host', 'remote']);
      await adapter.dispose();
      expect(shared.useIn).toEqual(['host', 'remote']);
    } finally {
      (globalThis as any).__FEDERATION__ = previousFederation;
    }
  });

  it('awaits teardown, retains only remote declarations and removes owned entry records', async () => {
    const { adapter, runtime } = fixture();
    const host = runtime.federation.instance as any;
    host.options = { remotes: [{ name: 'remote', entry: 'v2' }] };
    let disposed = false;
    host.destroy = async () => {
      await Promise.resolve();
      disposed = true;
    };
    await adapter.dispose(['a']);
    expect(disposed).toBe(false);
    await adapter.dispose();
    expect(disposed).toBe(true);
    expect(adapter.owner.entries.size).toBe(0);
    expect(adapter.owner.registrations).toEqual([
      { name: 'remote', entry: 'v2' },
    ]);
    expect(adapter.owner.registrations![0]).not.toBe(host.options.remotes[0]);
    adapter.prepareResources({ templates: {} });
    expect(adapter.owner.registrations).toBeUndefined();
  });
});

it('publishes an explicit client target even without initial hydration configuration', async () => {
  const { adapter, runtime } = fixture();
  const instance = runtime.federation.instance as any;
  instance.options = { remotes: [{ name: 'remote', entry: 'v1' }] };
  instance.updateRemotes = async (remotes: any[]) => {
    instance.options.remotes = remotes;
  };
  const resources = { templates: { a: '<html><head></head></html>' } };
  adapter.prepareResources(resources);
  expect(resources.templates.a).not.toContain('data-modern-mf-release');
  const application = {
    async update(
      invalidate: () => Promise<void>,
      scope?: () => readonly string[] | undefined,
    ) {
      scope?.();
      await invalidate();
      adapter.prepareResources(resources);
      return 1;
    },
  };
  await adapter.updateRemotes(application, [
    { name: 'remote', entry: 'v2', client: { entry: 'https://cdn/v2.json' } },
  ]);
  expect(resources.templates.a).toContain('data-modern-mf-release');
  expect(resources.templates.a).toContain('https://cdn/v2.json');
  expect(instance.options.remotes[0]).not.toHaveProperty('client');
  await expect(
    adapter.updateRemotes(application, [{ name: 'remote', entry: 'v3' }]),
  ).rejects.toThrow('public client remote');
});

it('refreshes a registered Service ingress without an SSR bundler instance', async () => {
  const oldRegistry = (globalThis as any)[key];
  (globalThis as any)[key] = new Map();
  const events: string[] = [];
  const adapter = createSSRUpdateAdapter({
    name: 'csr-service-host',
    entries: [],
    remotes: [{ name: 'service', entry: 'v1' }],
    invalidate: async targets => {
      events.push(`ingress:${targets[0].entry}`);
    },
  });
  const application = {
    async update(
      invalidate: () => Promise<void>,
      scope?: () => readonly string[] | undefined,
    ) {
      scope?.();
      events.push('drained');
      await invalidate();
      events.push('resources-published');
      return 1;
    },
  };
  try {
    await expect(
      adapter.updateRemotes(application, [
        {
          name: 'service',
          entry: 'v2',
          moduleInfo: { remoteEntry: 'v2.js', buildVersion: 'v2' },
        },
      ]),
    ).resolves.toMatchObject({ changed: true, mode: 'application' });
    expect(events).toEqual(['drained', 'ingress:v2', 'resources-published']);
    await expect(
      adapter.shouldUpdateRemote(application, {
        name: 'service',
        entry: 'v2',
        moduleInfo: { remoteEntry: 'v2.js', buildVersion: 'v2' },
      }),
    ).resolves.toBe(false);
  } finally {
    await adapter.dispose(undefined, { preserveRemotes: false });
    (globalThis as any)[key] = oldRegistry;
  }
});

it('publishes a whole-application adapter update through the real Modern owner without an entry scope resolver', async () => {
  const { createSSRApplication } =
    await import('../../../../server/core/src/adapters/node/application');
  const adapter = createSSRUpdateAdapter({
    name: 'real-owner-host',
    entries: [],
    remotes: [{ name: 'service', entry: 'v1' }],
  });
  let loaded = 0;
  const application = await createSSRApplication({
    maxPendingRequests: 2,
    requestTimeoutMs: 1000,
    drainTimeoutMs: 1000,
    load: async () => {
      loaded++;
      return {
        templates: {},
        serverManifest: {},
        render: async () => new Response('ready'),
      };
    },
  });
  try {
    await expect(
      adapter.updateRemotes(application, [
        {
          name: 'service',
          entry: 'v2',
          moduleInfo: { remoteEntry: 'v2.js', buildVersion: 'v2' },
        },
      ]),
    ).resolves.toMatchObject({ generation: 1, mode: 'application' });
    expect(loaded).toBe(2);
    await expect(
      application.update(
        async () => {},
        () => ['main'],
      ),
    ).rejects.toThrow('owned request scope resolver');
  } finally {
    await application.close();
    await adapter.dispose(undefined, { preserveRemotes: false });
  }
});

it('shares publication order and applied baselines between the compatibility and formal update entrances', async () => {
  const { adapter, runtime } = fixture();
  const instance = runtime.federation.instance as any;
  instance.options = { remotes: [{ name: 'remote', entry: 'v1' }] };
  instance.updateRemotes = async (remotes: any[]) => {
    instance.options.remotes = remotes;
  };
  let release!: () => void;
  let held = false;
  let count = 0;
  const barrier = new Promise<void>(resolve => {
    release = resolve;
  });
  const application = {
    async update(
      invalidate: () => Promise<void>,
      scope?: () => readonly string[] | undefined,
    ) {
      scope?.();
      if (held) await barrier;
      await invalidate();
      return ++count;
    },
  };
  await adapter.updateRemotes(application, [{ name: 'remote', entry: 'v2' }]);
  await adapter.update(application, 'remote', { entry: 'v1' });
  await expect(
    adapter.updateRemotes(application, [{ name: 'remote', entry: 'v2' }]),
  ).resolves.toMatchObject({ changed: true });
  held = true;
  const legacy = adapter.update(application, 'remote', { entry: 'v1' });
  await expect(
    adapter.shouldUpdateRemote(application, { name: 'remote', entry: 'v2' }),
  ).resolves.toBe(true);
  const formal = adapter.updateRemotes(application, [
    { name: 'remote', entry: 'v2' },
  ]);
  release();
  await Promise.all([legacy, formal]);
  expect(instance.options.remotes[0].entry).toBe('v2');
  await expect(
    adapter.shouldUpdateRemote(application, { name: 'remote', entry: 'v2' }),
  ).resolves.toBe(false);
  expect(count).toBe(5);
});

it('keeps compatibility deferred receipts synchronous while sharing publication order and adopted targets', async () => {
  const { adapter, runtime } = fixture();
  const instance = runtime.federation.instance as any;
  instance.options = { remotes: [{ name: 'remote', entry: 'v1' }] };
  instance.updateRemotes = async (remotes: any[]) => {
    instance.options.remotes = remotes;
  };
  let release!: () => void;
  const response = new Promise<void>(resolve => {
    release = resolve;
  });
  let count = 0;
  let accepted = 0;
  const application = {
    defer<T>(operation: () => Promise<T>) {
      if (++accepted > 1) throw new Error('queue is full');
      return { completed: response.then(operation) };
    },
    async update(
      invalidate: () => Promise<void>,
      scope?: () => readonly string[] | undefined,
    ) {
      scope?.();
      await invalidate();
      return ++count;
    },
  };
  await adapter.updateRemotes(application, [{ name: 'remote', entry: 'v2' }]);
  const receipt = adapter.update(
    application,
    'remote',
    { entry: 'v1' },
    { defer: 'after-response' },
  );
  expect(receipt).toMatchObject({ phase: 'scheduled' });
  expect(receipt).not.toHaveProperty('then');
  expect(count).toBe(1);
  expect(() =>
    adapter.update(
      application,
      'remote',
      { entry: 'v3' },
      { revision: 3, defer: 'after-response' },
    ),
  ).toThrow('queue is full');
  const followup = adapter.updateRemotes(application, [
    { name: 'remote', entry: 'v2' },
  ]);
  release();
  await followup;
  expect(count).toBe(3);
  expect(instance.options.remotes[0].entry).toBe('v2');
  await expect(
    adapter.shouldUpdateRemote(application, { name: 'remote', entry: 'v2' }),
  ).resolves.toBe(false);
});
