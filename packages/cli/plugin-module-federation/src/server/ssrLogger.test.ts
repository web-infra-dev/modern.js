import { debug, logger } from '@modern-js/utils';
import {
  createMFSSRLogger,
  debugMFSSR,
  debugMFSSRVerbose,
  extractTargetVersion,
  isMFSSRDebugEnabled,
  isMFSSRVerboseDebugEnabled,
  mfSSRDebug,
  mfSSRVerboseDebug,
} from './ssrLogger';

describe('ssrLogger', () => {
  const prevServerLogLevel = process.env.MODERN_SERVER_LOG_LEVEL;

  afterEach(() => {
    rs.restoreAllMocks();
    debug.disable();
    if (prevServerLogLevel === undefined) {
      delete process.env.MODERN_SERVER_LOG_LEVEL;
    } else {
      process.env.MODERN_SERVER_LOG_LEVEL = prevServerLogLevel;
    }
  });

  it('formats lifecycle events, escaping, AggregateError, Error stack/cause, and log level controls', () => {
    expect(
      extractTargetVersion({
        manifest: { metaData: { buildInfo: { buildVersion: 'v2' } } },
      }),
    ).toBe('v2');
    expect(extractTargetVersion({ moduleInfo: { buildVersion: 'v3' } })).toBe(
      'v3',
    );

    const infoSpy = rs.spyOn(logger, 'info').mockImplementation(() => {});
    const warnSpy = rs.spyOn(logger, 'warn').mockImplementation(() => {});
    const errorSpy = rs.spyOn(logger, 'error').mockImplementation(() => {});
    const emittedDebug: string[] = [];
    const originalLog = debug.log;
    debug.log = (...args: any[]) => {
      emittedDebug.push(String(args[0]));
    };

    try {
      const ssrLog = createMFSSRLogger({ app: 'host', mode: 'dev' });
      ssrLog.updateStart({
        trigger: 'hmr-check',
        operationId: '1:1',
        remotes: [
          { name: 'remote-a', fromVersion: 'v1', toVersion: 'v2' },
          { name: 'remote-b', note: 'url-changed' },
        ],
      });
      ssrLog.updateReady({
        remotes: ['remote-a'],
        planMode: 'entries',
        entries: ['main', 'weather'],
        generation: 2,
        timingsMs: { queue: 0.2, check: 4.2, drain: 12.6, total: 17.3 },
        operationId: '1:1',
      });
      ssrLog.updateFallback({
        remotes: ['remote-a'],
        error: new AggregateError(
          [new Error('C:\\app\\chunk.js'), new Error('quote "err"\nline2')],
          'partial failed',
        ),
        operationId: '   ',
      });
      const cause = new Error('root cause');
      const err = new Error('load failed', { cause });
      ssrLog.updateFailed({
        remotes: ['remote-a'],
        stage: 'rebuild',
        mutationStarted: true,
        phase: 'unavailable',
        timingsMs: { total: 42.4 },
        operationId: '1:1',
        error: err,
      });

      debug.enable('modern-js:mf-ssr');
      ssrLog.updateAborted({
        remotes: ['remote-a'],
        stage: 'queue',
        operationId: '1:2',
      });

      expect(infoSpy.mock.calls[0][0]).toBe(
        '[MF SSR] Updating remote-a (v1->v2), remote-b (url-changed) app=host mode=dev trigger=hmr-check op=1:1',
      );
      expect(infoSpy.mock.calls[1][0]).toBe(
        '[MF SSR] Ready remote-a app=host mode=dev scope=partial entries=main,weather gen=2 durationMs=17 timings=check:4,drain:13 op=1:1',
      );
      expect(warnSpy.mock.calls[0][0]).toBe(
        '[MF SSR] Fallback app=host scope=partial->full remotes=remote-a reason="partial failed: C:\\\\app\\\\chunk.js; quote \\"err\\" line2"',
      );
      expect(errorSpy.mock.calls[0][0]).toBe(
        '[MF SSR] Failed app=host remotes=remote-a mode=dev stage=rebuild mutationStarted=true phase=unavailable durationMs=42 op=1:1',
      );
      expect(errorSpy.mock.calls[0][1]).toBe(err);
      expect((errorSpy.mock.calls[0][1] as Error).cause).toBe(cause);
      expect((errorSpy.mock.calls[0][1] as Error).stack).toContain(
        'load failed',
      );
      expect(
        emittedDebug.some(line =>
          line.includes('update-aborted remotes=remote-a stage=queue op=1:2'),
        ),
      ).toBe(true);

      // MODERN_SERVER_LOG_LEVEL applies to prod/global but keeps dev intact
      process.env.MODERN_SERVER_LOG_LEVEL = 'warn';
      ssrLog.updateReady({
        mode: 'global',
        remotes: ['remote-a'],
        planMode: 'snapshot',
        operationId: 'g:1',
      });
      ssrLog.updateReady({
        mode: 'dev',
        remotes: ['remote-a'],
        planMode: 'snapshot',
        operationId: 'd:1',
      });
      expect(infoSpy).toHaveBeenCalledTimes(3);
      expect(infoSpy.mock.calls[2][0]).toContain('op=d:1');

      // Custom logger & logger: false
      delete process.env.MODERN_SERVER_LOG_LEVEL;
      const customInfo = rs.fn();
      createMFSSRLogger({
        app: 'svc',
        mode: 'prod',
        logger: { info: customInfo },
      }).updateReady({
        remotes: ['remote-a'],
        planMode: 'snapshot',
        operationId: 'c:1',
      });
      expect(customInfo).toHaveBeenCalledTimes(1);
      expect(customInfo.mock.calls[0][0]).toContain('app=svc');

      createMFSSRLogger({
        app: 'svc',
        mode: 'prod',
        logger: false,
      }).updateFailed({ stage: 'check', error: err });
      expect(errorSpy).toHaveBeenCalledTimes(1);
    } finally {
      debug.log = originalLog;
    }
  });

  it('splits modern-js:mf-ssr and modern-js:mf-ssr:verbose and avoids evaluating thunks when disabled', () => {
    expect(isMFSSRDebugEnabled()).toBe(false);
    expect(isMFSSRVerboseDebugEnabled()).toBe(false);

    const emitted: string[] = [];
    const originalLog = debug.log;
    debug.log = (...args: any[]) => {
      emitted.push(String(args[0]));
    };
    try {
      const lazyMain = rs.fn(() => ({ key: 'main', ratio: 1.5, blank: '  ' }));
      const lazyVerbose = rs.fn(() => ({ key: 'verbose' }));
      debugMFSSR('manifest-ready', lazyMain);
      debugMFSSRVerbose('check-noop', lazyVerbose);
      expect(lazyMain).not.toHaveBeenCalled();
      expect(lazyVerbose).not.toHaveBeenCalled();

      debug.enable('modern-js:mf-ssr');
      expect(mfSSRDebug.enabled).toBe(true);
      expect(mfSSRVerboseDebug.enabled).toBe(false);
      debugMFSSR('manifest-ready', lazyMain);
      debugMFSSRVerbose('check-noop', lazyVerbose);
      expect(lazyMain).toHaveBeenCalledTimes(1);
      expect(lazyVerbose).not.toHaveBeenCalled();
      expect(emitted[0]).toContain('manifest-ready key=main ratio=1.5');
      expect(emitted[0]).not.toContain('blank=');

      debug.enable('modern-js:mf-ssr:verbose');
      debugMFSSRVerbose('check-noop', lazyVerbose);
      expect(lazyVerbose).toHaveBeenCalledTimes(1);
      expect(emitted[1]).toContain('check-noop key=verbose');
    } finally {
      debug.log = originalLog;
    }
  });

  it('throttles coordinatorEvent and manifest503 internally and cleans up on dispose/clearManifest503', () => {
    rs.useFakeTimers();
    const warnSpy = rs.spyOn(logger, 'warn').mockImplementation(() => {});
    const emittedDebug: string[] = [];
    const originalLog = debug.log;
    debug.log = (...args: any[]) => {
      emittedDebug.push(String(args[0]));
    };

    try {
      const ssrLog = createMFSSRLogger({ app: 'host', mode: 'dev' });

      // 100 normal CSR fallbacks during updating -> 0 warn logs
      for (let i = 0; i < 100; i++) {
        ssrLog.coordinatorEvent({
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

      // Cross-generation rejections share one bounded throttle key and auto-evict after 5s
      for (let gen = 1; gen <= 10; gen++) {
        ssrLog.coordinatorEvent({
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
      expect(warnSpy.mock.calls[0][0]).toContain(
        '[MF SSR] Admission app=host decision=reject reason=unavailable phase=unavailable gen=1',
      );
      rs.advanceTimersByTime(5_000);
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy.mock.calls[1][0]).toContain('gen=10');
      expect(warnSpy.mock.calls[1][0]).toContain('suppressed=9');
      rs.advanceTimersByTime(10_000);
      expect(warnSpy).toHaveBeenCalledTimes(2);

      // Burst followed by dispose() flushes suppressed summary immediately
      for (const generation of [11, 12]) {
        ssrLog.coordinatorEvent({
          type: 'admission',
          decision: 'reject',
          reason: 'queue-full',
          phase: 'draining',
          generation,
          entryName: 'main',
          waitedMs: 5,
          activeRequests: 1,
          pendingRequests: 100,
        });
      }
      ssrLog.dispose();
      expect(warnSpy).toHaveBeenCalledTimes(4);
      expect(warnSpy.mock.calls[3][0]).toContain('suppressed=1');

      // manifest503: probe without waitHeader & not-ready routes to debug only
      warnSpy.mockClear();
      debug.enable('modern-js:mf-ssr');
      ssrLog.manifest503({
        path: '/mf-manifest.json',
        reason: 'not-ready',
        buildReady: false,
        ssrReady: false,
        waitHeader: false,
      });
      expect(warnSpy).not.toHaveBeenCalled();
      expect(
        emittedDebug.some(line =>
          line.includes('manifest-503 path=/mf-manifest.json reason=not-ready'),
        ),
      ).toBe(true);

      // manifest503: wait-timeout throttles within 5s and resets on clearManifest503()
      const timeout503 = {
        path: '/mf-manifest.json',
        reason: 'wait-timeout' as const,
        waitedMs: 5000,
        buildReady: false,
        ssrReady: false,
        waitHeader: true,
      };
      ssrLog.manifest503(timeout503);
      ssrLog.manifest503(timeout503);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain(
        '[MF SSR] Manifest 503 app=host path=/mf-manifest.json reason=wait-timeout',
      );

      ssrLog.clearManifest503();
      ssrLog.manifest503(timeout503);
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy.mock.calls[1][0]).not.toContain('suppressed=');
    } finally {
      debug.log = originalLog;
      rs.useRealTimers();
    }
  });
});
