import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { startDevRemoteUpdates } from './devRemoteUpdates';

const transport = rs.hoisted(() => ({
  callbacks: undefined as any,
  synchronized: new Set<string>(),
  publish: rs.fn(),
  invalidate: rs.fn(),
  close: rs.fn(async () => {}),
}));
rs.mock('@module-federation/enhanced/rspack', () => ({
  createDevBuildConnection: (_options: unknown, callbacks: unknown) => {
    transport.callbacks = callbacks;
    return {
      publish: transport.publish,
      invalidate: transport.invalidate,
      close: transport.close,
      isSynchronized: (remote: { entry: string }) =>
        transport.synchronized.has(remote.entry),
    };
  },
}));

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
  transport.synchronized.clear();
  rs.restoreAllMocks();
  rs.clearAllMocks();
});

describe('development build subscriptions and request fallback', () => {
  it('rejects a superseded Node build even when the browser build is unchanged', async () => {
    const current = manifest('release');
    Object.assign(current.metaData, {
      ssrRemoteEntry: { name: 'server.js', buildVersion: '2' },
    });
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(current),
    );
    const f = fixture();
    try {
      await expect(
        transport.callbacks.onUpdate({
          remote: remote('weather'),
          publication: { buildVersion: 'release', ssrBuildVersion: '1' },
        }),
      ).rejects.toThrow('superseded');
      expect(f.updateRemotes).not.toHaveBeenCalled();
      await transport.callbacks.onUpdate({
        remote: remote('weather'),
        publication: { buildVersion: 'release', ssrBuildVersion: '2' },
      });
      expect(f.updateRemotes).toHaveBeenCalledTimes(1);
    } finally {
      await f.watcher.close();
    }
  });

  it('performs no background polling and skips synchronized remotes on requests', async () => {
    const fetcher = rs.spyOn(globalThis, 'fetch');
    transport.synchronized.add(remote('weather').entry);
    const f = fixture();
    await f.watcher.check();
    expect(fetcher).not.toHaveBeenCalled();
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

  it('checks independent remotes in parallel even when one endpoint fails', async () => {
    const ready = deferred<Response>();
    const fetcher = rs
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async entry => {
        if (String(entry).includes('unavailable')) throw Error('offline');
        return ready.promise;
      });
    const f = fixture({ remotes: [remote('unavailable'), remote('weather')] });
    const check = f.watcher.check();
    await new Promise(resolve => setImmediate(resolve));
    expect(fetcher).toHaveBeenCalledTimes(2);
    ready.resolve(Response.json(manifest()));
    await check;
    expect(f.updateRemotes).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'weather' })],
      expect.anything(),
    );
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

  it('acknowledges a subscription only after Node publication and forwards original nested sources', async () => {
    rs.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json(manifest('b')),
    );
    const applied = deferred();
    const entered = deferred();
    const f = fixture({
      build: {
        publisher: () => remote('host'),
        subscribe: listener => {
          listener({ buildVersion: 'host-build' });
          return () => {};
        },
      },
      updateRemotes: rs.fn(async () => {
        entered.resolve();
        await applied.promise;
        return { changed: true };
      }),
    });
    const source = { ...remote('nested'), buildVersion: 'nested-b' };
    const update = transport.callbacks.onUpdate({
      remote: remote('weather'),
      publication: { buildVersion: 'b', sources: [source] },
    });
    await entered.promise;
    expect(f.onApplied).not.toHaveBeenCalled();
    expect(transport.invalidate).toHaveBeenCalledTimes(1);
    applied.resolve();
    await update;
    expect(transport.publish).toHaveBeenLastCalledWith({
      buildVersion: 'host-build',
      hot: false,
      sources: [
        source,
        { ...remote('weather'), buildVersion: 'b', hot: undefined },
      ],
    });
    expect(f.updateRemotes).toHaveBeenCalledWith(
      [expect.objectContaining({ dependencies: [source] })],
      expect.anything(),
    );
    await f.watcher.close();
  });

  it('revalidates only after a live HMR publication and reloads a build-and-serve change', async () => {
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(manifest('b')),
    );
    const f = fixture();
    await transport.callbacks.onUpdate({
      remote: remote('weather'),
      publication: { buildVersion: 'b', hot: true },
    });
    expect(f.onApplied).toHaveBeenLastCalledWith(expect.any(Array), {
      reload: false,
    });
    await f.watcher.check();
    expect(f.onApplied).toHaveBeenLastCalledWith(expect.any(Array), {
      reload: true,
    });
    await f.watcher.close();
  });

  it('rejects superseded publication evidence without acknowledging success', async () => {
    rs.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json(manifest('newer')),
    );
    const f = fixture();
    await expect(
      transport.callbacks.onUpdate({
        remote: remote('weather'),
        publication: { buildVersion: 'old' },
      }),
    ).rejects.toThrow('superseded');
    expect(f.updateRemotes).not.toHaveBeenCalled();
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
    const check = f.watcher.check();
    await entered.promise;
    await f.watcher.close();
    await check;
    expect(f.updateRemotes).not.toHaveBeenCalled();
    expect(f.onApplied).not.toHaveBeenCalled();
    expect(f.onError).not.toHaveBeenCalled();
  });
});
