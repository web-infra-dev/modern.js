import { afterEach, expect, it, rs } from '@rstest/core';
import * as originalBuilds from '../../../../packages/cli/plugin-module-federation/node_modules/@module-federation/enhanced/dist/src/rspack.js' with {
  rstest: 'importActual',
};
import { createDevManifestPublication } from '../../../../packages/cli/plugin-module-federation/src/cli/devManifest';
import { startDevRemoteUpdates } from '../../../../packages/cli/plugin-module-federation/src/server/devRemoteUpdates';
import updatePlugin from '../../../../packages/cli/plugin-module-federation/src/server/updatePlugin';
import { createRemoteManifestReader } from '../../../../packages/cli/plugin-module-federation/src/server/remoteUpdate';
import { DEV_MANIFEST_WAIT_HEADER } from '../../../../packages/cli/plugin-module-federation/src/ssr-runtime/devManifestWait';

const transport = rs.hoisted(() => ({
  callbacks: undefined as any,
  options: undefined as any,
  synchronized: new Set<string>(),
  publish: rs.fn(),
  invalidate: rs.fn(),
  connect: undefined as undefined | ((options: any, callbacks: any) => any),
}));
// Resolve through the framework package: the Weather test package deliberately
// does not declare the build plugin's enhanced dependency.
rs.mock(
  '../../../../packages/cli/plugin-module-federation/node_modules/@module-federation/enhanced/dist/src/rspack.js',
  () => ({
    createBuildVersionCoordinator: originalBuilds.createBuildVersionCoordinator,
    createDevBuildConnection: (options: unknown, callbacks: unknown) => {
      if (transport.connect) return transport.connect(options, callbacks);
      transport.callbacks = callbacks;
      return {
        publish: transport.publish,
        invalidate: transport.invalidate,
        close: async () => {},
        isSynchronized: (remote: { entry: string }) =>
          transport.synchronized.has(remote.entry),
      };
    },
  }),
);
rs.mock(
  '../../../../packages/cli/plugin-module-federation/src/server/ssrUpdate',
  () => ({
    createSSRUpdateServerPlugin: (options: unknown) => {
      transport.options = options;
      return { name: 'test-ssr-owner', setup() {} };
    },
  }),
);

const remote = (name = 'weather') => ({
  name,
  entry: `http://${name}/mf-manifest.json`,
});
const manifest = () => ({
  name: 'weather',
  metaData: {
    remoteEntry: { path: '', name: 'remoteEntry.js', type: 'global' },
    buildInfo: { buildVersion: 'next' },
    globalName: 'weather',
    publicPath: 'http://weather/',
  },
  exposes: [],
  shared: [],
});
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
}
function status(value: string, target = remote()) {
  if (value === 'ready') transport.synchronized.add(target.entry);
  else transport.synchronized.delete(target.entry);
  transport.callbacks.onStatus(target, value);
}
function fixture(overrides: Record<string, unknown> = {}) {
  const options = {
    remotes: [remote()],
    shouldUpdateRemote: rs.fn(async () => true),
    updateRemotes: rs.fn(async () => ({ changed: true })),
    onApplied: rs.fn(),
    onError: rs.fn(),
    ...overrides,
  };
  return { ...options, watcher: startDevRemoteUpdates(options) };
}
const request = (signal?: AbortSignal) =>
  new Request('http://host/page', { signal });
async function expectPending(promise: Promise<unknown>) {
  let settled = false;
  void promise.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );
  await Promise.resolve();
  await Promise.resolve();
  expect(settled).toBe(false);
}
afterEach(() => {
  transport.connect = undefined;
  transport.synchronized.clear();
  rs.useRealTimers();
  rs.restoreAllMocks();
  rs.clearAllMocks();
});

// Deliver the public broker state sequence: invalidation broadcasts waiting,
// publication becomes ready only after the consumer acknowledges its update.
// Superseded acknowledgements cannot replace the latest state.
function buildRelay() {
  const connections = new Set<any>();
  const publications = new Map<string, any>();
  const revisions = new Map<string, number>();
  const operations = new Set<Promise<void>>();
  let queued = 0;
  let messages = 0;
  const deliver = (connection: any, target: any) => {
    const revision = revisions.get(target.name);
    const publication = publications.get(target.name);
    queued++;
    queueMicrotask(() => {
      queued--;
      if (connection.closed) return;
      if (++messages > 1000)
        throw new Error('Build publication did not settle');
      const status = (value: string) => {
        connection.statuses.set(target.name, value);
        connection.callbacks.onStatus(target, value);
      };
      if (!publication) {
        status('waiting');
        return;
      }
      status('updating');
      const operation = (
        connection.queues.get(target.name) || Promise.resolve()
      )
        .then(async () => {
          if (revision !== revisions.get(target.name)) return;
          await connection.callbacks.onUpdate({ remote: target, publication });
          if (revision === revisions.get(target.name)) status('ready');
        })
        .catch(() => {
          if (revision === revisions.get(target.name)) status('waiting');
        });
      connection.queues.set(target.name, operation);
      operations.add(operation);
      void operation.finally(() => operations.delete(operation));
    });
  };
  const broadcast = (name: string, publication?: unknown) => {
    publications.set(name, publication);
    revisions.set(name, (revisions.get(name) || 0) + 1);
    for (const connection of connections)
      for (const target of connection.options.remotes)
        if (target.name === name) deliver(connection, target);
  };
  transport.connect = (options, callbacks) => {
    const connection = {
      options,
      callbacks,
      statuses: new Map<string, string>(),
      queues: new Map<string, Promise<void>>(),
      closed: false,
    };
    connections.add(connection);
    broadcast(options.publisher.name);
    for (const target of options.remotes) deliver(connection, target);
    return {
      publish: (value: unknown) => broadcast(options.publisher.name, value),
      invalidate: () => broadcast(options.publisher.name),
      isSynchronized: (target: any) =>
        connection.statuses.get(target.name) === 'ready',
      close: async () => {
        connection.closed = true;
        connections.delete(connection);
      },
    };
  };
  return {
    publications,
    debug: () =>
      [...connections].map(c => [
        c.options.publisher.name,
        [...c.statuses],
        publications.get(c.options.publisher.name),
      ]),
    ready: () =>
      !queued &&
      !operations.size &&
      [...connections].every(connection =>
        connection.options.remotes.every(
          (target: any) => connection.statuses.get(target.name) === 'ready',
        ),
      ),
    waiting: (name: string) =>
      [...connections].some(
        connection =>
          connection.options.publisher.name === name &&
          [...connection.statuses.values()].includes('waiting'),
      ),
  };
}

async function flushUntil(predicate: () => boolean) {
  for (let step = 0; step < 2000; step++) {
    if (predicate()) return;
    await Promise.resolve();
  }
  throw new Error('Development update state did not settle');
}

for (const [label, graph] of [
  ['two-node cycle', { a: ['b'], b: ['a'], d: ['a'] }],
  ['three-node cycle', { a: ['b'], b: ['c'], c: ['a'], d: ['b'] }],
  ['acyclic chain', { a: [], b: ['a'], d: ['b'] }],
] as const) {
  it(`propagates a changed build through a ${label} while allowing old SSR until the ready notification`, async () => {
    const relay = buildRelay();
    const blocked = deferred();
    const compiled = deferred();
    const nodes = new Map<string, any>();
    for (const [name, dependencies] of Object.entries(graph))
      nodes.set(name, {
        version: `${name}1`,
        dependencies,
        ready: true,
        applied: new Map<string, unknown>(),
      });
    rs.spyOn(globalThis, 'fetch').mockImplementation(async (url, input) => {
      const node = nodes.get(new URL(String(url)).hostname)!;
      if (!node.ready) {
        blocked.resolve();
        await new Promise<void>((resolve, reject) => {
          const signal = input!.signal!;
          const abort = () => reject(signal.reason);
          signal.addEventListener('abort', abort, { once: true });
          void compiled.promise.then(() => {
            signal.removeEventListener('abort', abort);
            resolve();
          });
          if (signal.aborted) abort();
        });
      }
      return Response.json({
        ...manifest(),
        metaData: {
          ...manifest().metaData,
          buildInfo: { buildVersion: node.version },
        },
        remotes: node.dependencies.map((name: string) => ({
          federationContainerName: name,
          entry: remote(name).entry,
        })),
      });
    });
    const fingerprint = (candidate: any) =>
      JSON.stringify([
        candidate.moduleInfo.metaData.buildInfo.buildVersion,
        candidate.dependencies,
      ]);
    try {
      for (const [name, node] of nodes) {
        node.watcher = startDevRemoteUpdates({
          remotes: node.dependencies.map(remote),
          build: {
            publisher: () => remote(name),
            subscribe(listener) {
              node.local = listener;
              return () => {};
            },
          },
          shouldUpdateRemote: async candidate =>
            node.applied.get(candidate.name) !== fingerprint(candidate),
          updateRemotes: async candidates => {
            for (const candidate of candidates)
              node.applied.set(candidate.name, fingerprint(candidate));
            return { changed: true };
          },
          onApplied() {},
          onError(error) {
            throw error;
          },
        });
      }
      for (const node of nodes.values())
        node.local({ buildVersion: node.version, hot: true });
      await flushUntil(relay.ready).catch(error => {
        throw new Error(`${error.message}: ${JSON.stringify(relay.debug())}`);
      });

      const producer = nodes.get('a');
      producer.ready = false;
      producer.local(undefined);
      await flushUntil(() => relay.waiting('d'));
      const admitted = rs.fn();
      // Only the consumer outside the cycle requests SSR. Recovery must not
      // depend on a request happening to visit an application inside the cycle.
      const consumer = nodes.get('d');
      const check = consumer.watcher.check(request()).then(() => {
        admitted([...consumer.applied.values()]);
      });
      await check;
      expect(admitted).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(admitted.mock.calls[0][0])).toContain('a1');

      producer.version = 'a2';
      producer.ready = true;
      compiled.resolve();
      producer.local({ buildVersion: 'a2', hot: true });
      await flushUntil(relay.ready).catch(error => {
        throw new Error(`${error.message}: ${JSON.stringify(relay.debug())}`);
      });
      await consumer.watcher.check(request());
      expect(JSON.stringify([...consumer.applied.values()])).toContain('a2');
      expect(relay.publications.get('d').sources).toContainEqual(
        expect.objectContaining({ name: 'a', buildVersion: 'a2' }),
      );
      for (const [name, node] of nodes)
        expect(node.version).toBe(name === 'a' ? 'a2' : `${name}1`);
    } finally {
      compiled.resolve();
      await Promise.all([...nodes.values()].map(node => node.watcher?.close()));
    }
  });
}

it('holds a new document until Node is ready, without waiting for broker acknowledgement', async () => {
  rs.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(manifest()));
  const entered = deferred();
  const rebuilt = deferred();
  const f = fixture({
    updateRemotes: rs.fn(async () => {
      entered.resolve();
      await rebuilt.promise;
      return { changed: true };
    }),
  });
  try {
    status('ready');
    status('waiting');
    await f.watcher.check(request());
    expect(f.updateRemotes).not.toHaveBeenCalled();
    status('updating');
    const update = transport.callbacks.onUpdate({
      remote: remote(),
      publication: { buildVersion: 'next' },
    });
    await entered.promise;
    const admitted = rs.fn();
    const check = f.watcher.check(request()).then(admitted);
    await expectPending(check);
    rebuilt.resolve();
    await Promise.all([update, check]);
    expect(admitted).toHaveBeenCalledTimes(1);
    expect(f.updateRemotes).toHaveBeenCalledTimes(1);
  } finally {
    rebuilt.resolve();
    await f.watcher.close();
  }
});

it('cancels one waiting document without cancelling another document or the Node update', async () => {
  rs.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(manifest()));
  const entered = deferred();
  const rebuilt = deferred();
  const f = fixture({
    updateRemotes: rs.fn(async () => {
      entered.resolve();
      await rebuilt.promise;
      return { changed: true };
    }),
  });
  const cancelled = new AbortController();
  try {
    status('updating');
    const update = transport.callbacks.onUpdate({
      remote: remote(),
      publication: { buildVersion: 'next' },
    });
    await entered.promise;
    const first = f.watcher.check(request(cancelled.signal));
    const second = f.watcher.check(request());
    const rejected = expect(first).rejects.toThrow('document closed');
    cancelled.abort(new Error('document closed'));
    await rejected;
    await expectPending(second);
    rebuilt.resolve();
    await Promise.all([update, second]);
    expect(f.onError).not.toHaveBeenCalled();
  } finally {
    rebuilt.resolve();
    await f.watcher.close();
  }
});

it('does not gate a never-published remote and falls back when the broker disconnects', async () => {
  const fetcher = rs
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async input => {
      if (String(input).includes('unused')) throw new Error('offline');
      return Response.json(manifest());
    });
  const f = fixture({ remotes: [remote(), remote('unused')] });
  try {
    status('ready');
    status('waiting', remote('unused'));
    await f.watcher.check(request());
    expect(fetcher).toHaveBeenCalledTimes(1);
    status('waiting');
    await f.watcher.check(request());
    status('disconnected');
    await f.watcher.check(request());
    expect(f.updateRemotes).toHaveBeenCalledTimes(1);
    expect(
      new Headers(
        fetcher.mock.calls.find(([url]) => String(url).includes('weather'))![1]
          ?.headers,
      ).get(DEV_MANIFEST_WAIT_HEADER),
    ).toBe('1');
  } finally {
    await f.watcher.close();
  }
});

it('invalidates the consumer publication while a known nested producer is rebuilding', async () => {
  const unavailable = new Set<string>();
  rs.spyOn(globalThis, 'fetch').mockImplementation(async url =>
    unavailable.has(String(url))
      ? new Response('not ready', { status: 503 })
      : Response.json(manifest()),
  );
  const f = fixture({
    remotes: [remote(), remote('nested')],
    shouldUpdateRemote: rs.fn(async () => false),
    build: {
      publisher: () => remote('host'),
      subscribe: (listener: (value: unknown) => void) => {
        listener({ buildVersion: 'host' });
        return () => {};
      },
    },
  });
  try {
    status('ready');
    status('ready', remote('nested'));
    const publications = transport.publish.mock.calls.length;
    status('waiting');
    expect(transport.invalidate).toHaveBeenCalledTimes(1);
    expect(transport.publish).toHaveBeenCalledTimes(publications);
    status('ready');
    expect(transport.publish).toHaveBeenCalledTimes(publications + 1);

    status('disconnected');
    status('disconnected', remote('nested'));
    unavailable.add(remote().entry);
    unavailable.add(remote('nested').entry);
    await expect(f.watcher.check(request())).rejects.toThrow('not ready');
    expect(transport.invalidate).toHaveBeenCalledTimes(2);
    expect(transport.publish).toHaveBeenCalledTimes(publications + 1);

    unavailable.delete(remote().entry);
    await expect(f.watcher.check(request())).rejects.toThrow('not ready');
    expect(transport.publish).toHaveBeenCalledTimes(publications + 1);
    // Even a broker ready event cannot erase a failed HTTP readiness check.
    status('ready', remote('nested'));
    expect(transport.publish).toHaveBeenCalledTimes(publications + 1);
    unavailable.clear();
    await f.watcher.check(request());
    expect(f.updateRemotes).not.toHaveBeenCalled();
    expect(transport.publish).toHaveBeenCalledTimes(publications + 2);
  } finally {
    await f.watcher.close();
  }
});

it('keeps checking a static manifest when the broker has never published that producer', async () => {
  let unavailable = false;
  const fetcher = rs
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () =>
      unavailable
        ? new Response('not ready', { status: 503 })
        : Response.json(manifest()),
    );
  const f = fixture({
    shouldUpdateRemote: rs.fn(async () => false),
    requestTimeoutMs: 50,
  });
  try {
    await f.watcher.check(request());
    // The broker also sends waiting when no publisher has ever registered.
    status('waiting');
    await f.watcher.check(request());
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(f.onError).not.toHaveBeenCalled();

    // HTTP success still establishes the baseline for the 503 safety guard.
    unavailable = true;
    await expect(f.watcher.check(request())).rejects.toThrow('not ready');
    unavailable = false;
    await f.watcher.check(request());
    expect(fetcher).toHaveBeenCalledTimes(4);
  } finally {
    await f.watcher.close();
  }
});

it('recovers a failed broker acknowledgement through HTTP without requiring another publication', async () => {
  let unavailable = true;
  const fetcher = rs
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () =>
      unavailable
        ? new Response('not ready', { status: 503 })
        : Response.json(manifest()),
    );
  const f = fixture({
    shouldUpdateRemote: rs.fn(async () => false),
    requestTimeoutMs: 50,
    build: {
      publisher: () => remote('host'),
      subscribe: (listener: (value: unknown) => void) => {
        listener({ buildVersion: 'host' });
        return () => {};
      },
    },
  });
  try {
    status('ready');
    const published = transport.publish.mock.calls.length;
    status('updating');
    const update = transport.callbacks.onUpdate({
      remote: remote(),
      publication: { buildVersion: 'next' },
    });
    const documents = Promise.allSettled([
      f.watcher.check(request()),
      f.watcher.check(request()),
    ]);
    await expect(update).rejects.toThrow('HTTP 503');
    // Core reports a failed acknowledgement as waiting without republishing.
    status('waiting');
    for (const result of await documents) {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected')
        expect(result.reason.message).toBe('Remote build is not ready');
    }
    expect(transport.publish).toHaveBeenCalledTimes(published);

    unavailable = false;
    const before = fetcher.mock.calls.length;
    await f.watcher.check(request());
    await f.watcher.check(request());
    expect(fetcher).toHaveBeenCalledTimes(before + 2);
    expect(f.updateRemotes).not.toHaveBeenCalled();
    expect(transport.publish).toHaveBeenCalledTimes(published + 1);

    // Only a new successful broker acknowledgement restores event admission.
    status('ready');
    status('waiting');
    const gated = f.watcher.check(request());
    await gated;
    expect(fetcher).toHaveBeenCalledTimes(before + 2);
  } finally {
    await f.watcher.close();
  }
});

for (const ending of ['timeout', 'close'] as const) {
  it(`returns 503 rather than entering old SSR on admission ${ending}`, async () => {
    rs.useFakeTimers();
    updatePlugin({
      name: 'host',
      remotes: [remote()],
      application: { requestTimeoutMs: 50 },
    });
    const rebuilding = deferred();
    const entered = deferred();
    rs.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(manifest()));
    const cleanup = transport.options.onReady(
      {
        shouldUpdateRemote: rs.fn(async () => true),
        updateRemotes: rs.fn(async (_targets, { signal }) => {
          entered.resolve();
          await Promise.race([
            rebuilding.promise,
            new Promise<void>(resolve =>
              signal.addEventListener('abort', () => resolve(), { once: true }),
            ),
          ]);
          return { changed: true };
        }),
      },
      { dev: { reload: rs.fn(), send: rs.fn() } },
    );
    status('updating');
    const update = transport.callbacks.onUpdate({
      remote: remote(),
      publication: { buildVersion: 'next' },
    });
    await entered.promise;
    const next = rs.fn();
    const response = transport.options
      .beforeRequest(request())
      .then((value: Response | undefined) => {
        if (!value) next();
        return value;
      });
    await expectPending(response);
    if (ending === 'close') await cleanup();
    else await rs.advanceTimersByTimeAsync(51);
    const unavailable = await response;
    expect(unavailable.status).toBe(503);
    expect(unavailable.headers.get('cache-control')).toBe('no-store');
    expect(next).not.toHaveBeenCalled();
    rebuilding.resolve();
    await update;
    await cleanup();
  });
}

it('rejects a known producer 503 after a disconnected broker instead of admitting old SSR', async () => {
  rs.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response('not ready', { status: 503 }),
  );
  updatePlugin({ name: 'host', remotes: [remote()] });
  const cleanup = transport.options.onReady(
    { shouldUpdateRemote: rs.fn(), updateRemotes: rs.fn() },
    { dev: { reload: rs.fn(), send: rs.fn() } },
  );
  try {
    status('ready');
    status('disconnected');
    const response = await transport.options.beforeRequest(request());
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
  } finally {
    await cleanup();
  }
});

it('does not reload or revalidate the browser after Node updates finish', async () => {
  rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    Response.json(manifest()),
  );
  updatePlugin({ name: 'host', remotes: [remote()] });
  const dev = { reload: rs.fn(), send: rs.fn() };
  const cleanup = transport.options.onReady(
    {
      shouldUpdateRemote: rs.fn(async () => true),
      updateRemotes: rs.fn(async () => ({ changed: true })),
    },
    { dev },
  );
  try {
    status('updating');
    await transport.callbacks.onUpdate({
      remote: remote(),
      publication: { buildVersion: 'next', hot: true },
    });
    status('ready');
    await transport.options.beforeRequest(request());
    // Both HMR-capable and static publication used to initiate browser work.
    status('disconnected');
    await transport.options.beforeRequest(request());
    expect(dev.reload).not.toHaveBeenCalled();
    expect(dev.send).not.toHaveBeenCalled();
  } finally {
    await cleanup();
  }
});

it('requests manifest readiness only through the private dev reader option', async () => {
  const fetcher = rs
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => Response.json(manifest()));
  await createRemoteManifestReader()(remote());
  await createRemoteManifestReader({ waitForDevReady: true })(remote());
  expect(
    new Headers(fetcher.mock.calls[0][1]?.headers).has(
      DEV_MANIFEST_WAIT_HEADER,
    ),
  ).toBe(false);
  expect(
    new Headers(fetcher.mock.calls[1][1]?.headers).get(
      DEV_MANIFEST_WAIT_HEADER,
    ),
  ).toBe('1');
});

function publicationFixture() {
  let compile!: (value: object) => void;
  let invalidate!: () => void;
  const publication = createDevManifestPublication();
  publication.attach(
    {
      options: { mode: 'development' },
      hooks: {
        thisCompilation: {
          tap: (_: unknown, fn: typeof compile) => {
            compile = fn;
          },
        },
        invalid: {
          tap: (_: unknown, fn: typeof invalidate) => {
            invalidate = fn;
          },
        },
      },
    } as any,
    () => {},
  );
  const build = () => {
    const compilation = {};
    compile(compilation);
    return { compilation };
  };
  return { publication, build, invalidate: () => invalidate() };
}

it('keeps wait-manifest pending across a superseded compilation until current SSR resources are ready', async () => {
  const { publication, build, invalidate } = publicationFixture();
  const waiting = publication.wait(new AbortController().signal);
  const stale = build();
  publication.publish(stale);
  invalidate();
  expect(publication.notifyReady(stale, { buildVersion: 'stale' })).toBe(false);
  const current = build();
  publication.setSSRReady(false);
  publication.publish(current);
  publication.notifyReady(current, { buildVersion: 'next' });
  await expectPending(waiting);
  publication.setSSRReady(true);
  await waiting;
});

it('removes a cancelled manifest waiter without cancelling another waiter', async () => {
  const { publication, build } = publicationFixture();
  const cancelled = new AbortController();
  const first = publication.wait(cancelled.signal);
  const second = publication.wait(new AbortController().signal);
  const rejected = expect(first).rejects.toThrow('connection closed');
  cancelled.abort(new Error('connection closed'));
  await rejected;
  const stats = build();
  publication.publish(stats);
  publication.notifyReady(stats, { buildVersion: 'ready' });
  await second;
});
