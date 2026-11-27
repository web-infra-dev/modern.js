import { debug, logger } from '@modern-js/utils';
import type { SSRCoordinatorEvent } from '@modern-js/server-core/node';
import { createDevManifestPublication } from '../cli/devManifest';
import { createSSRUpdateAdapter } from './ssrUpdate';
import { createSSRUpdateServerPlugin } from './ssrUpdateServer';
import { startDevRemoteUpdates } from './devRemoteUpdates';

function manifest(name: string, buildVersion: string, entry: string) {
  return {
    id: name,
    name,
    metaData: {
      name,
      type: 'app',
      buildInfo: { buildVersion, buildName: name },
      remoteEntry: {
        name: 'remoteEntry.js',
        path: '',
        type: 'global',
      },
      types: { path: '', name: '', zip: '', api: '' },
      globalName: name,
      pluginVersion: '0.0.0',
      publicPath: new URL('./', entry).href,
    },
    shared: [],
    remotes: [],
    exposes: [],
  } as any;
}

function createFakeApplication() {
  return {
    status: { phase: 'serving', generation: 0 },
    async update(
      invalidate: (entries?: readonly string[]) => Promise<void>,
      scope?: (previousPhase?: string) => readonly string[] | undefined,
    ) {
      const entries = scope?.('serving');
      await invalidate(entries);
      this.status.generation += 1;
      return this.status.generation;
    },
  };
}

describe('MF SSR update logging', () => {
  afterEach(() => {
    rs.restoreAllMocks();
    debug.disable();
  });

  it('logs consistent Updating and Ready across updateRemotes, adapter.update, and GlobalModuleInfo', async () => {
    const infoSpy = rs.spyOn(logger, 'info').mockImplementation(() => {});
    const entry = 'http://provider.test/static/mf-manifest.json';
    const adapter = createSSRUpdateAdapter({
      name: 'host',
      mode: 'prod',
      entries: ['main'],
      remotes: [
        {
          name: 'provider',
          entry,
          manifest: manifest('provider', 'v1', entry),
        },
      ],
    });
    const app = createFakeApplication();

    // 1. updateRemotes
    await adapter.updateRemotes(
      app as any,
      [
        {
          name: 'provider',
          entry,
          manifest: manifest('provider', 'v2', entry),
        },
      ],
      { trigger: 'api' },
    );
    expect(infoSpy.mock.calls[0][0]).toContain(
      '[MF SSR] Updating provider (v1->v2) app=host mode=prod trigger=api op=',
    );
    expect(infoSpy.mock.calls[1][0]).toContain(
      '[MF SSR] Ready provider app=host mode=prod scope=full',
    );
    expect(infoSpy.mock.calls[1][0]).toContain('gen=1');

    // 2. legacy adapter.update (submit)
    await adapter.update(
      app as any,
      'provider',
      { entry: 'http://provider.test/v3/mf-manifest.json' },
      { revision: 2 },
    );
    expect(infoSpy.mock.calls[2][0]).toContain(
      '[MF SSR] Updating provider (url-changed) app=host mode=prod trigger=api op=2:',
    );
    expect(infoSpy.mock.calls[3][0]).toContain(
      '[MF SSR] Ready provider app=host mode=prod scope=full',
    );
    expect(infoSpy.mock.calls[3][0]).toContain('gen=2');
  });

  it('preserves Error stack and cause on Failed logs and suppresses Failed on AbortSignal cancellation', async () => {
    const infoSpy = rs.spyOn(logger, 'info').mockImplementation(() => {});
    const errorSpy = rs.spyOn(logger, 'error').mockImplementation(() => {});
    const entry = 'http://provider.test/static/mf-manifest.json';
    const adapter = createSSRUpdateAdapter({
      name: 'host',
      mode: 'dev',
      entries: ['main'],
      remotes: [
        {
          name: 'provider',
          entry,
          manifest: manifest('provider', 'v1', entry),
        },
      ],
    });

    const rootCause = new Error('ECONNREFUSED');
    const failure = new Error('bundle load failed', { cause: rootCause });
    const failingApp = {
      status: { phase: 'serving', generation: 0 },
      async update() {
        this.status.phase = 'unavailable';
        throw failure;
      },
    };

    await expect(
      adapter.updateRemotes(
        failingApp as any,
        [
          {
            name: 'provider',
            entry,
            manifest: manifest('provider', 'v2', entry),
          },
        ],
        { trigger: 'hmr-check' },
      ),
    ).rejects.toThrow('bundle load failed');

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain('[MF SSR] Failed');
    expect(errorSpy.mock.calls[0][0]).toContain('remotes=provider');
    expect(errorSpy.mock.calls[0][0]).toContain('phase=unavailable');
    expect(errorSpy.mock.calls[0][1]).toBe(failure);
    expect((errorSpy.mock.calls[0][1] as Error).cause).toBe(rootCause);
    expect((errorSpy.mock.calls[0][1] as Error).stack).toContain(
      'bundle load failed',
    );

    // Aborted update must NOT emit error-level [MF SSR] Failed
    errorSpy.mockClear();
    const abortController = new AbortController();
    abortController.abort(new Error('server shutting down'));
    await expect(
      adapter.updateRemotes(
        failingApp as any,
        [
          {
            name: 'provider',
            entry,
            manifest: manifest('provider', 'v3', entry),
          },
        ],
        { signal: abortController.signal },
      ),
    ).rejects.toThrow('server shutting down');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('aggregates admission warnings under high concurrency and suppresses normal CSR fallback warnings', async () => {
    const warnSpy = rs.spyOn(logger, 'warn').mockImplementation(() => {});
    const errorSpy = rs.spyOn(logger, 'error').mockImplementation(() => {});
    const userEvents: SSRCoordinatorEvent[] = [];
    const context: any = {
      dev: true,
      routes: [{ isSSR: true, entryName: 'main' }],
    };
    const plugin = createSSRUpdateServerPlugin({
      name: 'host',
      application: {
        onEvent(event) {
          userEvents.push(event);
          throw new Error('user callback threw');
        },
      },
    });
    let prepareCb: (() => void) | undefined;
    plugin.setup!({
      onPrepare(cb: () => void) {
        prepareCb = cb;
      },
      getServerContext: () => context,
      updateServerContext(patch: Record<string, unknown>) {
        Object.assign(context, patch);
      },
    } as any);
    prepareCb!();

    const onEvent = context.ssrApplication.onEvent as (
      event: SSRCoordinatorEvent,
    ) => void;

    // 100 normal CSR fallback requests during updating -> 0 warn logs
    for (let i = 0; i < 100; i++) {
      onEvent({
        type: 'admission',
        decision: 'csr',
        reason: 'updating',
        phase: 'draining',
        generation: 1,
        entryName: 'main',
        waitedMs: 0,
        activeRequests: 2,
        pendingRequests: 0,
      });
    }
    expect(warnSpy).not.toHaveBeenCalled();

    // 100 rejected requests during unavailable -> only 1 immediate warn log
    for (let i = 0; i < 100; i++) {
      onEvent({
        type: 'admission',
        decision: 'reject',
        reason: 'unavailable',
        phase: 'unavailable',
        generation: 1,
        entryName: 'main',
        waitedMs: 0,
        activeRequests: 0,
        pendingRequests: 0,
      });
    }
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain(
      '[MF SSR] Admission app=host decision=reject reason=unavailable',
    );
    expect(userEvents).toHaveLength(200);

    // onInitialError preserves full Error object
    const initCause = new Error('missing chunk');
    const initErr = new Error('initial load failed', { cause: initCause });
    context.ssrApplication.onInitialError(initErr);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain(
      '[MF SSR] Failed app=host mode=dev stage=init phase=unavailable',
    );
    expect(errorSpy.mock.calls[0][1]).toBe(initErr);

    // Closing flushes suppressed summary cleanly
    context.ssrApplication.onReady({
      status: { phase: 'serving', generation: 1 },
      close: async () => {},
    });
    await context.ssrUpdateManager.close();
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy.mock.calls[1][0]).toContain('suppressed=99');
  });

  it('routes unchanged checks to modern-js:mf-ssr:verbose while keeping manifest-ready on modern-js:mf-ssr', async () => {
    const entry = 'http://provider.test/static/mf-manifest.json';
    const v1 = manifest('provider', 'v1', entry);
    rs.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(JSON.stringify(v1), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );

    const emitted: string[] = [];
    const originalLog = debug.log;
    debug.log = (...args: any[]) => {
      emitted.push(String(args[0]));
    };

    try {
      // Standard DEBUG=modern-js:mf-ssr does NOT spam check-noop / unchanged manifest-fetch
      debug.enable('modern-js:mf-ssr');
      const watcher = startDevRemoteUpdates({
        remotes: [{ name: 'provider', entry }],
        shouldUpdateRemote: async () => false,
        updateRemotes: async () => {},
        onError: () => {},
      });
      await watcher.notify('hmr-check');
      expect(emitted).toHaveLength(0);

      // Verbose namespace captures manifest-fetch and check-noop
      debug.enable('modern-js:mf-ssr:verbose');
      await watcher.notify('hmr-check');
      await watcher.close();

      expect(emitted.some(line => line.includes('manifest-fetch'))).toBe(true);
      expect(
        emitted.some(
          line =>
            line.includes('check-noop') &&
            line.includes('trigger=hmr-check') &&
            line.includes('remotes=provider@v1'),
        ),
      ).toBe(true);

      // manifest-ready stays on standard modern-js:mf-ssr
      debug.enable('modern-js:mf-ssr');
      const publication = createDevManifestPublication();
      const compilation = {};
      const hooks = {
        thisCompilation: { tap: (_opt: any, cb: any) => cb(compilation) },
        invalid: { tap: () => {} },
      };
      const stats = { compilation };
      publication.attach(
        { options: { mode: 'development' }, hooks } as any,
        () => {},
      );
      expect(publication.publish(stats)).toBe(true);
      expect(publication.notifyReady(stats, { buildVersion: 'v99' })).toBe(
        true,
      );
      expect(
        emitted.some(
          line =>
            line.includes('manifest-ready') &&
            line.includes('buildVersion=v99'),
        ),
      ).toBe(true);
    } finally {
      debug.log = originalLog;
    }
  });

  it('bounds admission throttle across generations and reports synchronous defer() failures', async () => {
    rs.useFakeTimers();
    try {
      const warnSpy = rs.spyOn(logger, 'warn').mockImplementation(() => {});
      const errorSpy = rs.spyOn(logger, 'error').mockImplementation(() => {});
      const context: any = {
        dev: true,
        routes: [{ isSSR: true, entryName: 'main' }],
      };
      const plugin = createSSRUpdateServerPlugin({ name: 'host' });
      let prepareCb: (() => void) | undefined;
      plugin.setup!({
        onPrepare(cb: () => void) {
          prepareCb = cb;
        },
        getServerContext: () => context,
        updateServerContext(patch: Record<string, unknown>) {
          Object.assign(context, patch);
        },
      } as any);
      prepareCb!();

      const onEvent = context.ssrApplication.onEvent as (
        event: SSRCoordinatorEvent,
      ) => void;

      // Cross-generation rejections share one bounded throttle key (phase|decision|reason)
      for (let gen = 1; gen <= 25; gen++) {
        onEvent({
          type: 'admission',
          decision: 'reject',
          reason: 'unavailable',
          phase: 'unavailable',
          generation: gen,
          entryName: 'main',
          waitedMs: 0,
          activeRequests: 0,
          pendingRequests: 0,
        });
      }
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('gen=1');

      // After 5s window, summary flushes with latest generation and clears state
      rs.advanceTimersByTime(5_000);
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy.mock.calls[1][0]).toContain('gen=25');
      expect(warnSpy.mock.calls[1][0]).toContain('suppressed=24');

      // No lingering timer or phantom flush after window is evicted
      rs.advanceTimersByTime(10_000);
      expect(warnSpy).toHaveBeenCalledTimes(2);

      // Synchronous application.defer() rejection emits [MF SSR] Failed with stage=queue
      const entry = 'http://provider.test/static/mf-manifest.json';
      const adapter = createSSRUpdateAdapter({
        name: 'host',
        mode: 'prod',
        entries: ['main'],
        remotes: [
          {
            name: 'provider',
            entry,
            manifest: manifest('provider', 'v1', entry),
          },
        ],
      });
      const deferErr = new Error('defer queue rejected');
      const deferApp = {
        status: { phase: 'serving', generation: 1 },
        defer() {
          throw deferErr;
        },
      };
      expect(() =>
        adapter.updateRemotes(
          deferApp as any,
          [
            {
              name: 'provider',
              entry,
              manifest: manifest('provider', 'v2', entry),
            },
          ],
          { defer: 'after-response', trigger: 'webhook' },
        ),
      ).toThrow('defer queue rejected');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toContain(
        '[MF SSR] Failed app=host remotes=provider mode=prod stage=queue mutationStarted=false phase=serving',
      );
      expect(errorSpy.mock.calls[0][1]).toBe(deferErr);
    } finally {
      rs.useRealTimers();
    }
  });
});
