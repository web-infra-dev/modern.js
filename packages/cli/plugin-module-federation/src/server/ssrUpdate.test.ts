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
  return {
    state,
    runtime,
    a,
    b,
    adapter: createSSRUpdateAdapter({
      name: 'host',
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
    fixture();
    expect(
      createSSRUpdateAdapter({
        name: 'host',
        entries: ['a', 'missing'],
        staticOnly: true,
      }).plan('remote').reasons,
    ).toContain('missing-entry-metadata');
    expect(
      createSSRUpdateAdapter({ name: 'host', entries: ['a', 'b'] }).plan(
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
    instance.options = { remotes: [{ name: 'remote', entry: 'v1' }] };
    let fail = true;
    const batches: any[][] = [];
    instance.updateRemotes = async (remotes: any[]) => {
      batches.push(remotes);
      instance.options.remotes = [];
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
    const { runtime } = fixture();
    const instance = runtime.federation.instance as any;
    instance.options = {
      remotes: [{ name: 'remote', alias: 'alias', entry: 'private-v1' }],
    };
    instance.updateRemotes = async (remotes: any[]) => {
      instance.options.remotes = remotes;
    };
    const adapter = createSSRUpdateAdapter({
      name: 'host',
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

describe('release checks and response-deferred notifications', () => {
  function deferredFixture() {
    const { adapter, runtime } = fixture();
    const instance = runtime.federation.instance as any;
    instance.options = {
      remotes: [{ name: 'remote', alias: 'alias', entry: 'v1' }],
    };
    instance.updateRemotes = async (remotes: any[]) => {
      instance.options.remotes = remotes;
    };
    let finish!: () => void;
    const response = new Promise<void>(resolve => {
      finish = resolve;
    });
    let publications = 0;
    let insideRequest = true;
    let fail = false;
    const application = {
      assertUpdateAllowed() {
        if (insideRequest)
          throw new Error('Cannot update SSR from a request being drained');
      },
      defer<T>(operation: () => Promise<T>) {
        return { completed: response.then(operation) };
      },
      async update(
        invalidate: (entries?: readonly string[]) => Promise<void>,
        scope?: () => readonly string[] | undefined,
      ) {
        if (fail) throw new Error('candidate failed');
        await invalidate(scope?.());
        return ++publications;
      },
    };
    return {
      adapter,
      application,
      instance,
      finish() {
        insideRequest = false;
        finish();
      },
      publications: () => publications,
      fail() {
        fail = true;
      },
    };
  }

  it('captures a deferred release, deduplicates aliases, and only advances the applied revision on publication', async () => {
    const f = deferredFixture();
    const remotes = [{ name: 'alias', entry: 'v2' }];
    expect(
      f.adapter.shouldUpdateRemotes(f.application, remotes, { revision: 2 }),
    ).toBe(true);
    expect(f.adapter.status(f.application)).toBeUndefined();
    let microtaskRan = false;
    queueMicrotask(() => {
      microtaskRan = true;
    });
    const accepted = f.adapter.updateRemotes(f.application, remotes, {
      revision: 2,
      defer: 'after-response',
    });
    expect(accepted).toMatchObject({ phase: 'scheduled', revision: 2 });
    expect(accepted).not.toHaveProperty('completed');
    expect(accepted).not.toHaveProperty('then');
    expect(microtaskRan).toBe(false);
    expect(f.instance.options.remotes[0].entry).toBe('v1');
    remotes[0].entry = 'mutated-by-caller';
    const duplicate = f.adapter.updateRemotes(
      f.application,
      [{ name: 'remote', entry: 'v2' }],
      { revision: 2, defer: 'after-response' },
    );
    expect(duplicate).toEqual(accepted);
    expect(duplicate).not.toHaveProperty('then');
    expect(
      f.adapter.shouldUpdateRemotes(
        f.application,
        [{ name: 'remote', entry: 'v2' }],
        { revision: 2 },
      ),
    ).toBe(true);
    expect(f.publications()).toBe(0);
    // Even a deduplicated update must reject when awaited inside the draining request.
    await expect(
      f.adapter.updateRemotes(
        f.application,
        [{ name: 'remote', entry: 'v2' }],
        { revision: 2 },
      ),
    ).rejects.toThrow('request being drained');
    f.finish();
    await f.adapter.updateRemotes(
      f.application,
      [{ name: 'remote', entry: 'v2' }],
      { revision: 2 },
    );
    expect(f.publications()).toBe(1);
    expect(f.instance.options.remotes[0].entry).toBe('v2');
    expect(
      f.adapter.shouldUpdateRemotes(
        f.application,
        [{ name: 'alias', entry: 'v2' }],
        { revision: 2 },
      ),
    ).toBe(false);
    expect(
      f.adapter.shouldUpdateRemotes(
        f.application,
        [{ name: 'remote', entry: 'v2' }],
        { revision: 3 },
      ),
    ).toBe(true);
    expect(
      f.adapter.shouldUpdateRemotes(
        f.application,
        [{ name: 'remote', entry: 'v1' }],
        { revision: 1 },
      ),
    ).toBe(false);
    expect(() =>
      f.adapter.shouldUpdateRemotes(
        f.application,
        [{ name: 'remote', entry: 'conflict' }],
        { revision: 2 },
      ),
    ).toThrow('different replacement');
  });

  it('reports background failures and permits retry without claiming the revision was applied', async () => {
    const f = deferredFixture();
    f.fail();
    f.adapter.updateRemotes(f.application, [{ name: 'remote', entry: 'v2' }], {
      revision: 2,
      defer: 'after-response',
    });
    f.finish();
    await expect(
      f.adapter.updateRemotes(
        f.application,
        [{ name: 'remote', entry: 'v2' }],
        { revision: 2 },
      ),
    ).rejects.toThrow('candidate failed');
    expect(f.adapter.status(f.application)).toMatchObject({
      phase: 'failed',
      appliedRevision: undefined,
    });
    expect(
      f.adapter.shouldUpdateRemotes(
        f.application,
        [{ name: 'remote', entry: 'v2' }],
        { revision: 2 },
      ),
    ).toBe(true);
  });

  it('does not replay an older deferred release after a newer notification', async () => {
    const f = deferredFixture();
    f.adapter.updateRemotes(f.application, [{ name: 'remote', entry: 'v2' }], {
      revision: 2,
      defer: 'after-response',
    });
    f.adapter.updateRemotes(f.application, [{ name: 'remote', entry: 'v3' }], {
      revision: 3,
      defer: 'after-response',
    });
    f.finish();
    await f.adapter.updateRemotes(
      f.application,
      [{ name: 'remote', entry: 'v3' }],
      { revision: 3 },
    );
    expect(f.publications()).toBe(1);
    expect(f.instance.options.remotes[0].entry).toBe('v3');
    expect(f.adapter.status(f.application)).toMatchObject({
      phase: 'applied',
      appliedRevision: 3,
    });
  });

  it('keeps the compiled alias for selective planning while comparing canonical provider identity', async () => {
    const { adapter, runtime } = fixture();
    const instance = runtime.federation.instance as any;
    instance.options = {
      remotes: [{ name: 'provider', alias: 'remote', entry: 'v1' }],
    };
    instance.updateRemotes = async (remotes: any[]) => {
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
    expect(
      await adapter.updateRemotes(
        application,
        [{ name: 'remote', entry: 'v2' }],
        { revision: 1 },
      ),
    ).toMatchObject({ mode: 'entries' });
    expect(
      adapter.shouldUpdateRemotes(
        application,
        [{ name: 'provider', entry: 'v2' }],
        { revision: 1 },
      ),
    ).toBe(false);
  });

  it('normalizes batch ordering and client fields identically for checking and updating', async () => {
    const { adapter, runtime } = fixture();
    (runtime.federation.instance as any).options = {
      remotes: [{ name: 'remote', entry: 'v1' }],
    };
    const application = { update: async () => 1 };
    await adapter.updateRemotes(
      application,
      [
        {
          name: 'remote',
          entry: 'v2',
          client: { type: 'global', entry: '/v2.json' },
        },
        { name: 'another', entry: 'v2' },
      ],
      { revision: 1 },
    );
    expect(
      adapter.shouldUpdateRemotes(
        application,
        [
          { name: 'another', entry: 'v2' },
          {
            name: 'remote',
            client: { entry: '/v2.json', type: 'global' },
            entry: 'v2',
          },
        ],
        { revision: 1 },
      ),
    ).toBe(false);
    expect(() =>
      adapter.shouldUpdateRemotes(
        application,
        [{ name: 'remote', entry: '' }],
        { revision: 2 },
      ),
    ).toThrow('replacement entries');
    expect(() =>
      adapter.shouldUpdateRemotes(
        application,
        [{ name: 'remote', entry: 'v3' }],
        { revision: NaN },
      ),
    ).toThrow('positive safe integer');
  });

  it('does not supersede an accepted release when the deferred queue rejects a newer submission', async () => {
    const f = deferredFixture();
    let submissions = 0;
    const defer = f.application.defer;
    f.application.defer = operation => {
      if (++submissions > 1)
        throw new Error('SSR deferred update queue is full');
      return defer(operation);
    };
    const accepted = f.adapter.updateRemotes(
      f.application,
      [{ name: 'remote', entry: 'v2' }],
      { revision: 2, defer: 'after-response' },
    );
    expect(() =>
      f.adapter.updateRemotes(
        f.application,
        [{ name: 'remote', entry: 'v3' }],
        { revision: 3, defer: 'after-response' },
      ),
    ).toThrow('queue is full');
    expect(f.adapter.status(f.application)).toMatchObject({
      revision: 2,
      operationId: accepted.operationId,
      phase: 'scheduled',
    });
    f.finish();
    await f.adapter.updateRemotes(
      f.application,
      [{ name: 'remote', entry: 'v2' }],
      { revision: 2 },
    );
    expect(f.publications()).toBe(1);
    expect(f.instance.options.remotes[0].entry).toBe('v2');
    expect(
      f.adapter.shouldUpdateRemotes(
        f.application,
        [{ name: 'remote', entry: 'v3' }],
        { revision: 3 },
      ),
    ).toBe(true);
  });

  it('throws for unsupported deferred integration without starting a mutation', () => {
    const { adapter } = fixture();
    let calls = 0;
    const application = { update: async () => ++calls };
    expect(() =>
      adapter.updateRemotes(application, [{ name: 'remote', entry: 'v2' }], {
        revision: 2,
        defer: 'after-response',
      }),
    ).toThrow('does not support deferred');
    expect(calls).toBe(0);
    expect(adapter.status(application)).toBeUndefined();
  });

  it('throws deferred validation errors synchronously while ordinary updates reject asynchronously', async () => {
    const f = deferredFixture();
    f.finish();
    const remotes = [{ name: 'remote', entry: '' }];
    expect(() =>
      f.adapter.updateRemotes(f.application, remotes, {
        revision: 2,
        defer: 'after-response',
      }),
    ).toThrow('replacement entries');
    expect(() =>
      f.adapter.updateRemotes(
        f.application,
        [{ name: 'remote', entry: 'v2' }],
        {
          revision: 0,
          defer: 'after-response',
        },
      ),
    ).toThrow('positive safe integer');
    const ordinary = f.adapter.updateRemotes(f.application, remotes, {
      revision: 2,
    });
    expect(ordinary).toBeInstanceOf(Promise);
    await expect(ordinary).rejects.toThrow('replacement entries');
    expect(f.adapter.status(f.application)).toBeUndefined();
    expect(f.publications()).toBe(0);
    expect(f.instance.options.remotes[0].entry).toBe('v1');
  });

  it('throws deferred revision conflicts synchronously without replacing an accepted receipt', async () => {
    const f = deferredFixture();
    const accepted = f.adapter.updateRemotes(
      f.application,
      [{ name: 'remote', entry: 'v2' }],
      { revision: 2, defer: 'after-response' },
    );
    expect(() =>
      f.adapter.updateRemotes(
        f.application,
        [{ name: 'remote', entry: 'conflict' }],
        { revision: 2, defer: 'after-response' },
      ),
    ).toThrow('different replacement');
    expect(() =>
      f.adapter.updateRemotes(
        f.application,
        [{ name: 'remote', entry: 'v1' }],
        { revision: 1, defer: 'after-response' },
      ),
    ).toThrow('Stale');
    expect(f.adapter.status(f.application)).toMatchObject({
      revision: 2,
      phase: 'scheduled',
      operationId: accepted.operationId,
    });
    expect(f.publications()).toBe(0);
    f.finish();
    await f.adapter.updateRemotes(
      f.application,
      [{ name: 'remote', entry: 'v2' }],
      { revision: 2 },
    );
    expect(f.publications()).toBe(1);
    expect(f.instance.options.remotes[0].entry).toBe('v2');
  });
});

describe('whole application instance handoff', () => {
  it('releases the entire generation shared usage before destroying any instance', async () => {
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
      expect(shared.useIn).toEqual([]);
    };
    try {
      await adapter.dispose(['a']);
      expect(shared.useIn).toEqual(['host', 'remote']);
      await adapter.dispose();
      expect(shared.useIn).toEqual([]);
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
    expect(
      [...(globalThis as any)[key].values()].map((r: any) => r.application),
    ).toEqual(['host:other']);
    const handoffs = (globalThis as any)[
      Symbol.for('modern-js.mf.ssr.registrations')
    ];
    expect(handoffs.get('host')).toEqual([{ name: 'remote', entry: 'v2' }]);
    expect(handoffs.get('host')[0]).not.toBe(host.options.remotes[0]);
    adapter.prepareResources({ templates: {} });
    expect(handoffs.has('host')).toBe(false);
  });
});
