import { afterEach, expect, it, rs } from '@rstest/core';
import { createDevManifestPublication } from '../../../../packages/cli/plugin-module-federation/src/cli/devManifest';
import { startDevRemoteUpdates } from '../../../../packages/cli/plugin-module-federation/src/server/devRemoteUpdates';
import updatePlugin from '../../../../packages/cli/plugin-module-federation/src/server/updatePlugin';
import { createRemoteManifestReader } from '../../../../packages/cli/plugin-module-federation/src/server/remoteUpdate';
import { DEV_MANIFEST_WAIT_HEADER } from '../../../../packages/cli/plugin-module-federation/src/ssr-runtime/devManifestWait';

const transport = rs.hoisted(() => ({ options: undefined as any }));
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
  rs.useRealTimers();
  rs.restoreAllMocks();
  rs.clearAllMocks();
});

it('holds new SSR until the shared Node update completes', async () => {
  rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    Response.json(manifest()),
  );
  const entered = deferred();
  const rebuilt = deferred();
  const f = fixture({
    updateRemotes: rs.fn(async () => {
      entered.resolve();
      await rebuilt.promise;
    }),
  });
  try {
    const update = f.watcher.notify();
    await entered.promise;
    const check = f.watcher.check(request());
    await expectPending(check);
    rebuilt.resolve();
    await Promise.all([update, check]);
    expect(f.updateRemotes).toHaveBeenCalledTimes(1);
  } finally {
    rebuilt.resolve();
    await f.watcher.close();
  }
});

it('cancels one waiting document without cancelling the shared update', async () => {
  rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    Response.json(manifest()),
  );
  const entered = deferred();
  const rebuilt = deferred();
  const f = fixture({
    updateRemotes: rs.fn(async () => {
      entered.resolve();
      await rebuilt.promise;
    }),
  });
  const cancelled = new AbortController();
  try {
    const update = f.watcher.notify();
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

it('checks configured manifests on every admission and retries after a failed read', async () => {
  let unavailable = false;
  const fetcher = rs
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () =>
      unavailable
        ? new Response('not ready', { status: 503 })
        : Response.json(manifest()),
    );
  const f = fixture({ shouldUpdateRemote: rs.fn(async () => false) });
  try {
    await f.watcher.check(request());
    unavailable = true;
    await expect(f.watcher.check(request())).rejects.toThrow('503');
    unavailable = false;
    await f.watcher.check(request());
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(f.updateRemotes).not.toHaveBeenCalled();
  } finally {
    await f.watcher.close();
  }
});

it('rechecks the latest manifest when another hint arrives during an update', async () => {
  let version = 'first';
  const entered = deferred();
  const rebuilt = deferred();
  rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    Response.json({
      ...manifest(),
      metaData: {
        ...manifest().metaData,
        buildInfo: { buildVersion: version },
      },
    }),
  );
  const f = fixture({
    updateRemotes: rs.fn(async () => {
      entered.resolve();
      await rebuilt.promise;
    }),
  });
  try {
    const first = f.watcher.notify();
    await entered.promise;
    version = 'second';
    const second = f.watcher.notify();
    const admission = f.watcher.check(request());
    await expectPending(admission);
    rebuilt.resolve();
    await Promise.all([first, second, admission]);
    expect(f.updateRemotes).toHaveBeenCalledTimes(2);
    expect(
      (f.updateRemotes as any).mock.calls[1][0][0].moduleInfo.metaData.buildInfo
        .buildVersion,
    ).toBe('second');
  } finally {
    rebuilt.resolve();
    await f.watcher.close();
  }
});

it('maps unavailable manifests to 503 without reloading or revalidating the browser', async () => {
  const { createSSRUpdateOwner, releaseSSRUpdateOwner } =
    await import('../../../../packages/cli/plugin-module-federation/src/server/ssrUpdateOwner');
  const owner = createSSRUpdateOwner('admission-test');
  const dev = { reload: rs.fn(), send: rs.fn() };
  let unavailable = true;
  rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    unavailable
      ? new Response('not ready', { status: 503 })
      : Response.json(manifest()),
  );
  updatePlugin({ name: 'host', remotes: [remote()] });
  const manager = {
    shouldUpdateRemote: rs.fn(async () => true),
    updateRemotes: rs.fn(async () => ({ changed: true })),
  };
  const cleanup = transport.options.onReady(manager, {
    dev,
    ssrUpdateOwnerId: owner.id,
  });
  try {
    const failed = await transport.options.beforeRequest(request());
    expect(failed.status).toBe(503);
    expect(failed.headers.get('cache-control')).toBe('no-store');
    unavailable = false;
    expect(await transport.options.beforeRequest(request())).toBeUndefined();
    expect(manager.updateRemotes).toHaveBeenCalledTimes(1);
    expect(dev.reload).not.toHaveBeenCalled();
    expect(dev.send).not.toHaveBeenCalled();
  } finally {
    await cleanup();
    releaseSSRUpdateOwner(owner);
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
