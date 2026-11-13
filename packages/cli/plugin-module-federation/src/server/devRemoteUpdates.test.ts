import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { startDevRemoteUpdates } from './devRemoteUpdates';

const transport = rs.hoisted(() => ({
  callbacks: undefined as any,
  options: undefined as any,
  synchronized: new Set<string>(),
  publish: rs.fn(),
  invalidate: rs.fn(),
  reportResult: rs.fn(),
  close: rs.fn(async () => {}),
}));
const logger = rs.hoisted(() => ({ info: rs.fn() }));
rs.mock('@modern-js/utils', () => ({ logger }));
rs.mock('@module-federation/enhanced/rspack', () => ({
  createDevBuildConnection: (options: unknown, callbacks: unknown) => {
    transport.options = options;
    transport.callbacks = callbacks;
    return {
      publish: transport.publish,
      invalidate: transport.invalidate,
      reportResult: transport.reportResult,
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
  it('rejects a superseded application build before updating', async () => {
    const current = manifest('2');
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(current),
    );
    const f = fixture();
    try {
      await expect(
        transport.callbacks.onUpdate({
          remote: remote('weather'),
          publication: { buildVersion: '1' },
        }),
      ).rejects.toThrow('superseded');
      expect(f.updateRemotes).not.toHaveBeenCalled();
      await transport.callbacks.onUpdate({
        remote: remote('weather'),
        publication: { buildVersion: '2' },
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
    expect(transport.reportResult.mock.calls).toEqual([
      [
        remote('unavailable'),
        expect.objectContaining({
          outcome: 'failed',
          trigger: 'manifest',
          stage: 'check',
          error: expect.stringContaining('Error: offline'),
        }),
      ],
      [
        expect.objectContaining({ name: 'weather' }),
        expect.objectContaining({ outcome: 'applied', trigger: 'manifest' }),
      ],
    ]);
    expect(logger.info).toHaveBeenCalledWith('[MF] weather updated');
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
    expect(transport.reportResult).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
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
    expect(transport.reportResult).not.toHaveBeenCalled();
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
    expect(transport.reportResult).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'weather' }),
      expect.objectContaining({
        outcome: 'applied',
        trigger: 'notification',
        buildVersion: 'b',
      }),
    );
    expect(logger.info.mock.calls).toEqual([
      ['[MF] host ready'],
      ['[MF] weather updated'],
    ]);
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
    expect(transport.reportResult).not.toHaveBeenCalled();
  });

  it('prints ready once per local build and uses the actual broker URL', async () => {
    let publish!: (
      value: { buildVersion: string; hot?: boolean } | undefined,
    ) => void;
    const f = fixture({
      consumer: 'host',
      build: {
        publisher: () => remote('host'),
        subscribe: listener => {
          publish = listener;
          return () => {};
        },
      },
    });
    expect(transport.options.consumer).toBe('host');
    expect(logger.info).not.toHaveBeenCalled();
    publish({ buildVersion: 'a' });
    publish({ buildVersion: 'a' });
    publish(undefined);
    publish({ buildVersion: 'a' });
    publish({ buildVersion: 'a', hot: true });
    expect(transport.publish).toHaveBeenCalledTimes(3);
    expect(logger.info.mock.calls).toEqual([['[MF] host ready']]);
    publish({ buildVersion: 'b' });
    transport.callbacks.onDiagnostics({
      brokerId: 'remote-broker',
      url: 'http://remote-machine:16322/__mf/logs',
    });
    transport.callbacks.onDiagnostics({
      brokerId: 'restarted-remote-broker',
      url: 'http://remote-machine:16322/__mf/logs',
    });
    expect(logger.info.mock.calls).toEqual([
      ['[MF] host ready'],
      ['[MF] host ready'],
      ['[MF] logs: http://remote-machine:16322/__mf/logs'],
    ]);
    await f.watcher.close();
  });

  it('reports completed batches per remote but prints one short update line', async () => {
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(manifest('b')),
    );
    const f = fixture({
      consumer: 'host',
      remotes: [remote('shop'), remote('cart')],
      updateRemotes: rs.fn(async () => ({
        changed: true,
        operationId: 'operation-1',
        timingsMs: { total: 12 },
      })),
    });
    await f.watcher.check();
    expect(transport.options.consumer).toBe('host');
    expect(f.onApplied).toHaveBeenCalledTimes(1);
    expect(logger.info.mock.calls).toEqual([['[MF] shop, cart updated']]);
    expect(transport.reportResult).toHaveBeenCalledTimes(2);
    for (const name of ['shop', 'cart'])
      expect(transport.reportResult).toHaveBeenCalledWith(
        expect.objectContaining({ name }),
        {
          outcome: 'applied',
          trigger: 'manifest',
          buildVersion: 'b',
          operationId: 'operation-1',
          timingsMs: { total: 12 },
        },
      );
    await f.watcher.close();
  });

  it('does not report an update when the owner resolves a duplicate as unchanged', async () => {
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(manifest()),
    );
    const f = fixture({
      updateRemotes: rs.fn(async () => ({ changed: false })),
    });
    await f.watcher.check();
    expect(f.onApplied).not.toHaveBeenCalled();
    expect(transport.reportResult).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
    await f.watcher.close();
  });

  it('reports update failure details without converting a failed notification to success', async () => {
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(manifest('b')),
    );
    const error = Object.assign(new Error('replacement failed'), {
      operationId: 'failed-operation',
      failedStage: 'clear',
      timingsMs: { total: 10 },
    });
    const f = fixture({
      updateRemotes: rs.fn(async () => {
        throw error;
      }),
    });
    await expect(
      transport.callbacks.onUpdate({
        remote: remote('weather'),
        publication: { buildVersion: 'b' },
      }),
    ).rejects.toBe(error);
    expect(transport.reportResult).toHaveBeenCalledTimes(1);
    expect(transport.reportResult).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'weather' }),
      {
        outcome: 'failed',
        trigger: 'notification',
        buildVersion: 'b',
        operationId: 'failed-operation',
        stage: 'clear',
        timingsMs: { total: 10 },
        error: error.stack,
      },
    );
    expect(f.onApplied).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
    await f.watcher.close();
  });

  it('keeps updates working when terminal logging or broker result reporting fails', async () => {
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(manifest('b')),
    );
    const f = fixture();
    logger.info.mockImplementationOnce(() => {
      throw new Error('terminal closed');
    });
    expect(() =>
      transport.callbacks.onDiagnostics({
        brokerId: 'broker',
        url: 'http://localhost:16322/__mf/logs',
      }),
    ).not.toThrow();
    logger.info.mockImplementationOnce(() => {
      throw new Error('terminal closed');
    });
    transport.reportResult.mockImplementationOnce(() => {
      throw new Error('broker closed');
    });
    await transport.callbacks.onUpdate({
      remote: remote('weather'),
      publication: { buildVersion: 'b' },
    });
    expect(f.onApplied).toHaveBeenCalledTimes(1);
    expect(f.onError).not.toHaveBeenCalled();
    await f.watcher.close();
  });

  it('records the completed update even when notifying the browser throws', async () => {
    rs.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(manifest('b')),
    );
    const error = new Error('refresh notification failed');
    const f = fixture({
      onApplied: rs.fn(() => {
        throw error;
      }),
    });
    await expect(
      transport.callbacks.onUpdate({
        remote: remote('weather'),
        publication: { buildVersion: 'b' },
      }),
    ).rejects.toBe(error);
    expect(transport.reportResult).toHaveBeenCalledTimes(1);
    expect(transport.reportResult).toHaveBeenCalledWith(
      remote('weather'),
      expect.objectContaining({ outcome: 'applied', buildVersion: 'b' }),
    );
    expect(logger.info).not.toHaveBeenCalled();
    await f.watcher.close();
  });
});
