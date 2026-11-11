import { afterEach, describe, expect, it, rs } from '@rstest/core';
import {
  createRemoteUpdateController,
  moduleInfoFingerprint,
} from './remoteUpdate';

const info = (version: string) => ({
  remoteEntry: `${version}.js`,
  buildVersion: version,
  modules: [
    { moduleName: '.', assets: { js: { sync: [`${version}.js`], async: [] } } },
  ],
});
const target = (version: string, name = 'remote') => ({
  name,
  entry: 'https://remote/mf-manifest.json',
  moduleInfo: info(version),
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
function fixture() {
  const registered = [
    target('a'),
    { ...target('x', 'other'), entry: 'https://other/mf-manifest.json' },
  ];
  const apply = rs.fn(async () => ({ generation: 1 }));
  const controller = createRemoteUpdateController({
    resolve: name =>
      registered.find(
        remote => remote.name === (name === 'alias' ? 'remote' : name),
      ),
    baseline: remote => remote.moduleInfo,
    apply,
  });
  const application = { status: { phase: 'serving' } };
  return { controller, application, registered, apply };
}
afterEach(() => rs.restoreAllMocks());
describe('application remote target checks', () => {
  it('always returns a promise, uses the registered URL fast path, and rejects unknown registrations', async () => {
    const f = fixture();
    const fetcher = rs.spyOn(globalThis, 'fetch');
    await expect(
      f.controller.shouldUpdateRemote(f.application, {
        name: 'remote',
        entry: 'https://new/mf-manifest.json',
      }),
    ).resolves.toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
    const check = f.controller.shouldUpdateRemote(
      f.application,
      target('b', 'missing'),
    );
    expect(check).toBeInstanceOf(Promise);
    await expect(check).rejects.toThrow('not registered');
  });
  it('ignores mutable runtime fields and object key order, but tracks modules/assets and buildVersion', async () => {
    const f = fixture();
    await expect(
      f.controller.shouldUpdateRemote(
        f.application,
        {
          ...target('a'),
          moduleInfo: {
            ...info('a'),
            remotesInfo: { random: {} },
            consumerList: ['host'],
            dev: { hot: true },
            useIn: ['host'],
            loaded: true,
          },
        },
        { revision: 999 },
      ),
    ).resolves.toBe(false);
    await expect(
      f.controller.shouldUpdateRemote(f.application, target('b'), {
        revision: 1,
      }),
    ).resolves.toBe(true);
    expect(
      moduleInfoFingerprint({ buildVersion: 'a', remoteEntry: 'a.js' }, ''),
    ).toBe(
      moduleInfoFingerprint({ remoteEntry: 'a.js', buildVersion: 'a' }, ''),
    );
  });
  it('reads same-URL candidate manifests without mutating registered or applied snapshots', async () => {
    const f = fixture();
    const before = structuredClone(f.registered);
    const manifest = {
      name: 'remote',
      metaData: {
        remoteEntry: { path: '', name: 'b.js', type: 'global' },
        buildInfo: { buildVersion: 'b' },
        globalName: 'remote',
        publicPath: 'https://remote/',
      },
      exposes: [],
      shared: [],
    };
    const fetcher = rs
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json(manifest));
    const signal = new AbortController().signal;
    await expect(
      f.controller.shouldUpdateRemote(
        f.application,
        { name: 'remote', entry: target('a').entry },
        { signal, revalidate: true },
      ),
    ).resolves.toBe(true);
    expect(fetcher).toHaveBeenCalledWith(target('a').entry, {
      signal,
      cache: 'no-store',
    });
    expect(f.registered).toEqual(before);
    expect(f.apply).not.toHaveBeenCalled();
    await expect(
      f.controller.shouldUpdateRemote(f.application, target('a')),
    ).resolves.toBe(false);
  });
  it('propagates candidate failures and aborts without mutation', async () => {
    const f = fixture();
    rs.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 503 }),
    );
    await expect(
      f.controller.shouldUpdateRemote(f.application, {
        name: 'remote',
        entry: target('a').entry,
      }),
    ).rejects.toThrow('503');
    const abort = new AbortController();
    abort.abort(new Error('cancelled'));
    await expect(
      f.controller.shouldUpdateRemote(f.application, target('b'), {
        signal: abort.signal,
      }),
    ).rejects.toThrow('cancelled');
    expect(f.apply).not.toHaveBeenCalled();
  });
});
describe('publication and pending intent', () => {
  it('deduplicates identical pending aliases, advances only after success, and keeps applications independent', async () => {
    const f = fixture();
    const gate = deferred<{ generation: number }>();
    f.apply.mockReturnValueOnce(gate.promise);
    const first = f.controller.updateRemotes(f.application, [target('b')]);
    const duplicate = f.controller.updateRemotes(f.application, [
      target('b', 'alias'),
    ]);
    expect(first).toBe(duplicate);
    await expect(
      f.controller.shouldUpdateRemote(f.application, target('b')),
    ).resolves.toBe(true);
    gate.resolve({ generation: 2 });
    await first;
    await expect(
      f.controller.shouldUpdateRemote(f.application, target('b')),
    ).resolves.toBe(false);
    await expect(
      f.controller.shouldUpdateRemote(
        { status: { phase: 'serving' } },
        target('b'),
      ),
    ).resolves.toBe(true);
    expect(f.apply).toHaveBeenCalledTimes(1);
    await expect(
      f.controller.updateRemotes(f.application, [target('b')]),
    ).resolves.toMatchObject({ changed: false });
  });
  it('supports rollback and in-flight A -> B -> A without suppressing the last intent', async () => {
    const f = fixture();
    const gate = deferred<{ generation: number }>();
    f.apply.mockReturnValueOnce(gate.promise);
    const b = f.controller.updateRemotes(f.application, [target('b')], {
      revision: 9,
    });
    await expect(
      f.controller.shouldUpdateRemote(f.application, target('a')),
    ).resolves.toBe(true);
    const a = f.controller.updateRemotes(f.application, [target('a')], {
      revision: 1,
    });
    gate.resolve({ generation: 2 });
    await Promise.all([a, b]);
    expect(f.apply).toHaveBeenCalledTimes(2);
    await expect(
      f.controller.shouldUpdateRemote(f.application, target('a')),
    ).resolves.toBe(false);
    await expect(
      f.controller.shouldUpdateRemote(f.application, target('b')),
    ).resolves.toBe(true);
  });
  it('does not lose unrelated remote baselines and retries failures including unavailable recovery', async () => {
    const f = fixture();
    await f.controller.updateRemotes(f.application, [target('b')]);
    await expect(
      f.controller.shouldUpdateRemote(f.application, f.registered[1]),
    ).resolves.toBe(false);
    f.apply.mockRejectedValueOnce(new Error('publish failed'));
    await expect(
      f.controller.updateRemotes(f.application, [target('c')]),
    ).rejects.toThrow('publish failed');
    await expect(
      f.controller.shouldUpdateRemote(f.application, target('b')),
    ).resolves.toBe(false);
    f.application.status.phase = 'unavailable';
    await expect(
      f.controller.shouldUpdateRemote(f.application, target('b')),
    ).resolves.toBe(true);
    await expect(
      f.controller.updateRemotes(f.application, [target('b')]),
    ).resolves.toMatchObject({ changed: true });
    expect(f.apply).toHaveBeenCalledTimes(3);
  });
  it('returns a synchronous receipt and performs same-URL fetch only after response completion', async () => {
    const f = fixture();
    const gate = deferred<void>();
    const application = {
      ...f.application,
      defer: <T>(operation: () => Promise<T>) => ({
        completed: gate.promise.then(operation),
      }),
    };
    const fetcher = rs
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('offline'));
    const receipt = f.controller.updateRemotes(
      application,
      [{ name: 'remote', entry: target('a').entry }],
      { defer: 'after-response' },
    );
    expect(receipt).toMatchObject({ phase: 'scheduled' });
    expect(receipt).not.toHaveProperty('then');
    expect(fetcher).not.toHaveBeenCalled();
    gate.resolve();
    await expect
      .poll(() => f.controller.status(application)?.phase)
      .toBe('failed');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(f.apply).not.toHaveBeenCalled();
  });
  it('preserves an accepted deferred operation when a subsequent admission is rejected', async () => {
    const f = fixture();
    const gate = deferred<void>();
    let count = 0;
    const application = {
      ...f.application,
      defer: <T>(operation: () => Promise<T>) => {
        if (++count > 1) throw new Error('full');
        return { completed: gate.promise.then(operation) };
      },
    };
    const accepted = f.controller.updateRemotes(application, [target('b')], {
      defer: 'after-response',
    });
    expect(() =>
      f.controller.updateRemotes(application, [target('c')], {
        defer: 'after-response',
      }),
    ).toThrow('full');
    expect(f.controller.status(application)?.operationId).toBe(
      (accepted as any).operationId,
    );
    gate.resolve();
    await expect
      .poll(() => f.controller.status(application)?.phase)
      .toBe('applied');
    expect(f.apply).toHaveBeenCalledTimes(1);
  });
});

it('checks fetched same-URL rollback against pending B and does not dedupe unknown candidates', async () => {
  const f = fixture();
  const manifest = (version: string) => ({
    name: 'remote',
    metaData: {
      remoteEntry: { path: '', name: `${version}.js`, type: 'global' },
      buildInfo: { buildVersion: version },
      globalName: 'remote',
      publicPath: 'https://remote/',
    },
    exposes: [],
    shared: [],
  });
  f.registered[0].moduleInfo = manifest('a') as any;
  const fetcher = rs
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(Response.json(manifest('b')));
  const gate = deferred<{ generation: number }>();
  f.apply.mockReturnValueOnce(gate.promise);
  const unknown = { name: 'remote', entry: target('a').entry };
  const b = f.controller.updateRemotes(f.application, [unknown]);
  await expect.poll(() => f.apply.mock.calls.length).toBe(1);
  fetcher.mockImplementation(async () => Response.json(manifest('a')));
  await expect(
    f.controller.shouldUpdateRemote(f.application, unknown),
  ).resolves.toBe(true);
  const a = f.controller.updateRemotes(f.application, [unknown]);
  expect(a).not.toBe(b);
  gate.resolve({ generation: 2 });
  await Promise.all([a, b]);
  expect(f.apply).toHaveBeenCalledTimes(2);
  await expect(
    f.controller.shouldUpdateRemote(f.application, unknown),
  ).resolves.toBe(false);
});

it('supports direct remoteEntry URL changes without polling JavaScript as JSON', async () => {
  const f = fixture();
  f.registered[0] = {
    name: 'remote',
    entry: 'https://remote/remoteEntry.js',
  } as any;
  const fetcher = rs.spyOn(globalThis, 'fetch');
  await expect(
    f.controller.shouldUpdateRemote(f.application, f.registered[0]),
  ).resolves.toBe(false);
  await expect(
    f.controller.shouldUpdateRemote(f.application, {
      name: 'remote',
      entry: 'https://remote/remoteEntry-v2.js',
    }),
  ).resolves.toBe(true);
  expect(fetcher).not.toHaveBeenCalled();
});

it('cancels an unstarted deferred submission and waits for publications already in progress', async () => {
  const f = fixture();
  const signal = new AbortController();
  const gate = deferred<{ generation: number }>();
  f.apply.mockReturnValueOnce(gate.promise);
  const b = f.controller.updateRemotes(f.application, [target('b')], {
    signal: signal.signal,
  });
  await expect.poll(() => f.apply.mock.calls.length).toBe(1);
  const application = {
    ...f.application,
    defer: () => ({ completed: new Promise<any>(() => {}) }),
  };
  f.controller.updateRemotes(application, [target('b')], {
    defer: 'after-response',
    signal: signal.signal,
  });
  signal.abort(new Error('closed'));
  await f.controller.whenIdle(application);
  let idle = false;
  const waiting = f.controller.whenIdle(f.application).then(() => {
    idle = true;
  });
  await Promise.resolve();
  expect(idle).toBe(false);
  gate.resolve({ generation: 2 });
  await b;
  await waiting;
  expect(f.apply).toHaveBeenCalledTimes(1);
});

it('does not let an aborted queued update bypass an earlier publication', async () => {
  const f = fixture();
  const gate = deferred<{ generation: number }>();
  f.apply.mockReturnValueOnce(gate.promise);
  const a = f.controller.updateRemotes(f.application, [target('b')]);
  const abort = new AbortController();
  const b = f.controller.updateRemotes(f.application, [target('c')], {
    signal: abort.signal,
  });
  abort.abort(new Error('cancel queued'));
  const c = f.controller.updateRemotes(f.application, [target('d')]);
  await expect(b).rejects.toThrow('cancel queued');
  await expect.poll(() => f.apply.mock.calls.length).toBe(1);
  gate.resolve({ generation: 1 });
  await Promise.all([a, c]);
  expect(f.apply).toHaveBeenCalledTimes(2);
});

it('bounds accepted checks/publications, deduplicates within capacity, and releases capacity after settlement', async () => {
  const gate = deferred<{ generation: number }>();
  const apply = rs.fn(async () => gate.promise);
  const controller = createRemoteUpdateController({
    maxPendingUpdates: 1,
    resolve: name => (name === 'remote' ? target('a') : undefined),
    baseline: () => info('a'),
    apply,
  });
  const application = {
    status: { phase: 'serving' },
    defer: <T>(operation: () => Promise<T>) => ({
      completed: Promise.resolve().then(operation),
    }),
  };
  const b = controller.updateRemotes(application, [target('b')]);
  expect(controller.updateRemotes(application, [target('b')])).toBe(b);
  await expect(
    controller.updateRemotes(application, [target('c')]),
  ).rejects.toThrow('queue is full');
  expect(() =>
    controller.updateRemotes(application, [target('c')], {
      defer: 'after-response',
    }),
  ).toThrow('queue is full');
  gate.resolve({ generation: 2 });
  await b;
  await expect(
    controller.updateRemotes(application, [target('c')]),
  ).resolves.toMatchObject({ changed: true });
  expect(apply).toHaveBeenCalledTimes(2);
});
