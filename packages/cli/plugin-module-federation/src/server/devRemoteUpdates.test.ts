import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { startDevRemoteUpdates } from './devRemoteUpdates';

const remote = (name: string) => ({
  name,
  entry: `http://${name}/mf-manifest.json`,
});
const manifest = (version = 'a') => ({
  name: 'remote',
  metaData: {
    remoteEntry: { path: '', name: 'remoteEntry.js', type: 'global' },
    buildInfo: { buildVersion: version },
    globalName: 'remote',
    publicPath: 'http://remote/',
  },
  exposes: [],
  shared: [],
});
function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(value => {
    resolve = value;
  });
  return { promise, resolve };
}
function fixture(
  overrides: Partial<Parameters<typeof startDevRemoteUpdates>[0]> = {},
) {
  const options = {
    remotes: [remote('weather')],
    shouldUpdateRemote: rs.fn(async () => true),
    updateRemotes: rs.fn(async () => ({ changed: true })),
    onApplied: rs.fn(),
    onError: rs.fn(),
    ...overrides,
  };
  return { ...options, watcher: startDevRemoteUpdates(options) };
}
afterEach(() => {
  rs.restoreAllMocks();
  rs.clearAllMocks();
});

describe('request-driven development updates', () => {
  it('reads the current manifest instead of accepting a browser supplied build version', async () => {
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(manifest('2')),
    );
    const f = fixture();
    await f.watcher.notify();
    expect(f.updateRemotes).toHaveBeenCalledWith(
      [expect.objectContaining({ moduleInfo: manifest('2') })],
      expect.anything(),
    );
    await f.watcher.close();
  });

  it('performs no background polling but checks every new SSR admission', async () => {
    const fetcher = rs
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json(manifest()));
    const f = fixture({ shouldUpdateRemote: rs.fn(async () => false) });
    expect(fetcher).not.toHaveBeenCalled();
    await f.watcher.check();
    await f.watcher.check();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(f.updateRemotes).not.toHaveBeenCalled();
    await f.watcher.close();
  });

  it('coalesces concurrent requests and sends the read candidate straight to the update owner', async () => {
    const entered = deferred();
    const ready = deferred<Response>();
    const fetcher = rs
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => {
        entered.resolve();
        return ready.promise;
      });
    const f = fixture();
    const first = f.watcher.check();
    await entered.promise;
    const next = f.watcher.check();
    expect(next).toBe(first);
    expect(f.onApplied).not.toHaveBeenCalled();
    ready.resolve(Response.json(manifest()));
    await Promise.all([first, next]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(f.updateRemotes).toHaveBeenCalledWith(
      [{ ...remote('weather'), moduleInfo: manifest(), dependencies: [] }],
      { signal: expect.any(AbortSignal) },
    );
    expect(f.onApplied).toHaveBeenCalledTimes(1);
    await f.watcher.close();
  });

  it('checks independent remotes in parallel and rejects admission if a candidate fails', async () => {
    const ready = deferred<Response>();
    const fetcher = rs
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async entry => {
        if (String(entry).includes('unavailable')) throw Error('offline');
        return ready.promise;
      });
    const f = fixture({ remotes: [remote('unavailable'), remote('weather')] });
    const check = expect(f.watcher.check()).rejects.toThrow('offline');
    await new Promise(resolve => setImmediate(resolve));
    expect(fetcher).toHaveBeenCalledTimes(2);
    ready.resolve(Response.json(manifest()));
    await check;
    expect(f.updateRemotes).not.toHaveBeenCalled();
    expect(f.onError).toHaveBeenCalledTimes(1);
    await f.watcher.close();
  });

  it('uses conditional requests and does not update or notify for an unchanged candidate', async () => {
    const fetcher = rs
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        Response.json(manifest(), { headers: { etag: '"a"' } }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 304 }));
    const f = fixture({ shouldUpdateRemote: rs.fn(async () => false) });
    await f.watcher.check();
    await f.watcher.check();
    expect(
      new Headers(fetcher.mock.calls[1][1]?.headers).get('if-none-match'),
    ).toBe('"a"');
    expect(f.updateRemotes).not.toHaveBeenCalled();
    expect(f.onApplied).not.toHaveBeenCalled();
    await f.watcher.close();
  });

  it('waits for Node preparation before releasing admission and records dynamic nested sources', async () => {
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(manifest('b')),
    );
    const applied = deferred();
    const entered = deferred();
    const f = fixture({
      dependencies: r => (r.name === 'weather' ? [remote('nested')] : []),
      updateRemotes: rs.fn(async () => {
        entered.resolve();
        await applied.promise;
        return { changed: true };
      }),
    });
    const update = f.watcher.notify();
    await entered.promise;
    expect(f.onApplied).not.toHaveBeenCalled();
    applied.resolve();
    await update;
    expect(f.updateRemotes).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          dependencies: [{ ...remote('nested'), buildVersion: 'b' }],
        }),
      ],
      expect.anything(),
    );
    await f.watcher.close();
  });

  it('waits for Node preparation without requiring a broker notification', async () => {
    const fetcher = rs
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json(manifest('b')));
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
      const update = f.watcher.notify();
      await entered.promise;
      let admitted = false;
      const document = f.watcher
        .check(new Request('http://host/page'))
        .then(() => {
          admitted = true;
        });
      await new Promise(resolve => setImmediate(resolve));
      expect(admitted).toBe(false);
      rebuilt.resolve();
      await Promise.all([update, document]);
      expect(admitted).toBe(true);
      expect(f.updateRemotes).toHaveBeenCalledTimes(1);
      expect(f.onApplied).toHaveBeenLastCalledWith(expect.any(Array));
    } finally {
      rebuilt.resolve();
      await f.watcher.close();
    }
  });

  it('checks Service readiness before SSR without a notification', async () => {
    let version = 'initial';
    const compiling = deferred<Response>();
    const entered = deferred();
    let reading = false;
    const serviceManifest = () => ({
      ...manifest(version),
      exposes: [{ name: 'App', path: './App', servicePath: '/service/App' }],
    });
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      if (reading) {
        entered.resolve();
        return compiling.promise;
      }
      return Response.json(serviceManifest());
    });
    const f = fixture();
    try {
      await f.watcher.check(new Request('http://host/service'));
      const previous = f.updateRemotes.mock.calls.length;
      reading = true;
      let admitted = false;
      const document = f.watcher
        .check(new Request('http://host/service'))
        .then(() => {
          admitted = true;
        });
      await entered.promise;
      await new Promise(resolve => setImmediate(resolve));
      expect(admitted).toBe(false);
      expect(f.updateRemotes).toHaveBeenCalledTimes(previous);
      version = 'next';
      compiling.resolve(Response.json(serviceManifest()));
      await document;
      expect(f.updateRemotes).toHaveBeenCalledTimes(previous + 1);
      expect(f.updateRemotes.mock.calls.at(-1)![0][0].moduleInfo).toEqual(
        serviceManifest(),
      );
      expect(admitted).toBe(true);
    } finally {
      compiling.resolve(Response.json(serviceManifest()));
      await f.watcher.close();
    }
  });

  it('keeps documents waiting across consecutive updates and coalesces queued notifications to the latest', async () => {
    let version = 'a';
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(manifest(version)),
    );
    const firstEntered = deferred();
    const firstReady = deferred();
    const nextEntered = deferred();
    const nextReady = deferred();
    const f = fixture({
      updateRemotes: rs.fn(async () => {
        if (version === 'a') {
          firstEntered.resolve();
          await firstReady.promise;
        } else {
          nextEntered.resolve();
          await nextReady.promise;
        }
        return { changed: true };
      }),
    });
    const notify = (_buildVersion: string) => f.watcher.notify();
    try {
      const first = notify('a');
      await firstEntered.promise;
      let admitted = false;
      const document = f.watcher
        .check(new Request('http://host/page'))
        .then(() => {
          admitted = true;
        });
      const second = notify('b');
      const latest = notify('c');
      version = 'c';
      firstReady.resolve();
      await nextEntered.promise;
      await new Promise(resolve => setImmediate(resolve));
      expect(admitted).toBe(false);
      nextReady.resolve();
      await Promise.all([first, second, latest, document]);
      expect(f.updateRemotes).toHaveBeenCalledTimes(2);
      expect(
        f.updateRemotes.mock.calls[1][0][0].moduleInfo.metaData.buildInfo
          .buildVersion,
      ).toBe('c');
      expect(admitted).toBe(true);
    } finally {
      firstReady.resolve();
      nextReady.resolve();
      await f.watcher.close();
    }
  });

  it('retains queued updates from different producers', async () => {
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(manifest('next')),
    );
    const f = fixture({ remotes: [remote('weather'), remote('other')] });
    try {
      const updates = [f.watcher.notify()];
      await Promise.all([
        ...updates,
        f.watcher.check(new Request('http://host/page')),
      ]);
      expect(
        f.updateRemotes.mock.calls.flatMap(([targets]) =>
          targets.map(target => target.name),
        ),
      ).toEqual(['weather', 'other']);
    } finally {
      await f.watcher.close();
    }
  });

  it('keeps SSR unavailable after application recovery fails until another update succeeds', async () => {
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(manifest('next')),
    );
    const f = fixture({
      updateRemotes: rs
        .fn()
        .mockRejectedValueOnce(
          new Error('SSR update and application recovery failed'),
        )
        .mockResolvedValue({ changed: true }),
    });
    const notify = () => f.watcher.notify();
    try {
      await expect(notify()).rejects.toThrow('application recovery failed');
      await f.watcher.check(new Request('http://host/page'));
      expect(f.updateRemotes).toHaveBeenCalledTimes(2);
    } finally {
      await f.watcher.close();
    }
  });

  it('discovers dynamically injected D on the next admission', async () => {
    const remotes = [remote('weather')];
    const fetcher = rs
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json(manifest()));
    const f = fixture({ remotes: () => remotes });
    await f.watcher.check();
    remotes.push(remote('D'));
    await f.watcher.check();
    expect(
      fetcher.mock.calls.some(([url]) => String(url) === remote('D').entry),
    ).toBe(true);
    await f.watcher.close();
  });

  it('detects a nested build behind an unchanged build-and-serve provider and terminates cycles', async () => {
    const fetcher = rs
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async entry => {
        const name = new URL(String(entry)).hostname;
        return Response.json({
          ...manifest(name === 'weather' ? 'unchanged' : 'nested-new'),
          remotes: [
            {
              federationContainerName:
                name === 'weather' ? 'nested' : 'weather',
              entry: remote(name === 'weather' ? 'nested' : 'weather').entry,
            },
          ],
        });
      });
    const f = fixture();
    await f.watcher.check();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(f.updateRemotes).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          dependencies: [{ ...remote('nested'), buildVersion: 'nested-new' }],
          moduleInfo: expect.objectContaining({
            metaData: expect.objectContaining({
              buildInfo: { buildVersion: 'unchanged' },
            }),
          }),
        }),
      ],
      expect.anything(),
    );
    await f.watcher.close();
  });

  it('cancels fallback reads on close and never reports cancellation as an update', async () => {
    const entered = deferred();
    rs.spyOn(globalThis, 'fetch').mockImplementation(async (_entry, input) => {
      entered.resolve();
      return new Promise<Response>((_resolve, reject) => {
        input!.signal!.addEventListener('abort', () =>
          reject(input!.signal!.reason),
        );
      });
    });
    const f = fixture();
    const check = expect(f.watcher.check()).rejects.toThrow();
    await entered.promise;
    await f.watcher.close();
    await check;
    expect(f.updateRemotes).not.toHaveBeenCalled();
    expect(f.onApplied).not.toHaveBeenCalled();
    expect(f.onError).not.toHaveBeenCalled();
  });
});
