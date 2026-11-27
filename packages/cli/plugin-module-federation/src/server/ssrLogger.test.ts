import { debug, logger } from '@modern-js/utils';
import {
  createMFSSRLogger,
  createWindowedThrottle,
  debugMFSSR,
  debugMFSSRVerbose,
  extractTargetVersion,
  formatErrorMessage,
  formatLogFields,
  formatRemoteTransitions,
  formatTimings,
  isMFSSRDebugEnabled,
  isMFSSRVerboseDebugEnabled,
  logMFSSR,
  logMFSSRError,
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

  it('formats single-line logfmt fields, skipping empty/whitespace strings and escaping quotes/backslashes', () => {
    expect(
      formatLogFields({
        mode: 'dev',
        scope: 'partial',
        entries: ['main', 'weather'],
        emptyArr: [],
        emptyStr: '',
        whitespaceStr: '   \n\t  ',
        missing: undefined,
        nil: null,
        durationMs: 43,
        ratio: 1.5,
        ok: true,
        winPath: 'C:\\app\\dist\\bundle.js',
        reason: 'Shared manifests changed\nduring "selective" update',
      }),
    ).toBe(
      'mode=dev scope=partial entries=main,weather durationMs=43 ratio=1.5 ok=true winPath="C:\\\\app\\\\dist\\\\bundle.js" reason="Shared manifests changed during \\"selective\\" update"',
    );
  });

  it('formats compact timings omitting total and zero-ms stages', () => {
    expect(
      formatTimings({
        queue: 0.2,
        check: 12.4,
        analyze: 0.1,
        drain: 85.6,
        rebuild: 36.1,
        total: 134.4,
      }),
    ).toBe('check:12,drain:86,rebuild:36');
    expect(formatTimings({ total: 5, check: 0 })).toBeUndefined();
  });

  it('extracts buildVersion from manifest or moduleInfo and formats transitions', () => {
    expect(
      extractTargetVersion({
        manifest: { metaData: { buildInfo: { buildVersion: 'v2' } } },
      }),
    ).toBe('v2');
    expect(
      extractTargetVersion({
        moduleInfo: { buildVersion: 'v3' },
      }),
    ).toBe('v3');
    expect(
      formatRemoteTransitions([
        { name: 'remote-a', fromVersion: 'v1', toVersion: 'v2' },
        { name: 'remote-b', toVersion: 'v4' },
        { name: 'remote-c', note: 'url-changed' },
        { name: 'remote-d' },
      ]),
    ).toBe(
      'remote-a (v1->v2), remote-b (v4), remote-c (url-changed), remote-d',
    );
  });

  it('formats AggregateError messages cleanly', () => {
    const err = new AggregateError(
      [new Error('first failure'), new Error('second failure')],
      'SSR update failed',
    );
    expect(formatErrorMessage(err)).toBe(
      'SSR update failed: first failure; second failure',
    );
  });

  it('emits structured [MF SSR] lines and preserves raw Error stack and cause in logMFSSRError', () => {
    const infoSpy = rs.spyOn(logger, 'info').mockImplementation(() => {});
    const errorSpy = rs.spyOn(logger, 'error').mockImplementation(() => {});

    logMFSSR(
      'info',
      'Updating',
      { mode: 'dev', trigger: 'hmr-check', app: 'host', op: '1:2' },
      'remote-a (v1->v2)',
      { mode: 'dev' },
    );

    const rootCause = new Error('root cause details');
    const err = new Error('top level failure', { cause: rootCause });
    logMFSSRError('Failed', { app: 'host', stage: 'rebuild', op: '1:2' }, err, {
      mode: 'dev',
    });

    expect(infoSpy).toHaveBeenCalledWith(
      '[MF SSR] Updating remote-a (v1->v2) mode=dev trigger=hmr-check app=host op=1:2',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      '[MF SSR] Failed app=host stage=rebuild op=1:2',
      err,
    );
    const loggedError = errorSpy.mock.calls[0][1] as Error;
    expect(loggedError.stack).toContain('top level failure');
    expect(loggedError.cause).toBe(rootCause);
  });

  it('respects MODERN_SERVER_LOG_LEVEL in prod mode and supports custom or disabled logger', () => {
    const infoSpy = rs.spyOn(logger, 'info').mockImplementation(() => {});
    const warnSpy = rs.spyOn(logger, 'warn').mockImplementation(() => {});

    process.env.MODERN_SERVER_LOG_LEVEL = 'warn';
    logMFSSR('info', 'Updating', { mode: 'prod' }, 'a', { mode: 'prod' });
    logMFSSR('warn', 'Fallback', { mode: 'prod' }, undefined, { mode: 'prod' });
    logMFSSR('info', 'Updating', { mode: 'dev' }, 'a', { mode: 'dev' });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0][0]).toContain('mode=dev');
    expect(warnSpy).toHaveBeenCalledTimes(1);

    const customInfo = rs.fn();
    delete process.env.MODERN_SERVER_LOG_LEVEL;
    logMFSSR('info', 'Ready', { mode: 'prod' }, 'a', {
      mode: 'prod',
      logger: { info: customInfo },
    });
    logMFSSR('info', 'Ready', { mode: 'prod' }, 'a', {
      mode: 'prod',
      logger: false,
    });
    expect(customInfo).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it('splits modern-js:mf-ssr and modern-js:mf-ssr:verbose and avoids evaluating thunks when disabled', () => {
    debug.disable();
    expect(isMFSSRDebugEnabled()).toBe(false);
    expect(isMFSSRVerboseDebugEnabled()).toBe(false);

    const emitted: string[] = [];
    const originalLog = debug.log;
    debug.log = (...args: any[]) => {
      emitted.push(String(args[0]));
    };
    try {
      const lazyMain = rs.fn(() => ({ key: 'main' }));
      const lazyVerbose = rs.fn(() => ({ key: 'verbose' }));
      debugMFSSR('manifest-ready', lazyMain);
      debugMFSSRVerbose('check-noop', lazyVerbose);
      expect(lazyMain).not.toHaveBeenCalled();
      expect(lazyVerbose).not.toHaveBeenCalled();
      expect(emitted).toHaveLength(0);

      debug.enable('modern-js:mf-ssr');
      expect(mfSSRDebug.enabled).toBe(true);
      expect(mfSSRVerboseDebug.enabled).toBe(false);
      debugMFSSR('manifest-ready', lazyMain);
      debugMFSSRVerbose('check-noop', lazyVerbose);
      expect(lazyMain).toHaveBeenCalledTimes(1);
      expect(lazyVerbose).not.toHaveBeenCalled();
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toContain('manifest-ready key=main');

      debug.enable('modern-js:mf-ssr:verbose');
      debugMFSSRVerbose('check-noop', lazyVerbose);
      expect(lazyVerbose).toHaveBeenCalledTimes(1);
      expect(emitted).toHaveLength(2);
      expect(emitted[1]).toContain('check-noop key=verbose');
    } finally {
      debug.log = originalLog;
    }
  });

  it('bounds windowed throttle entries and evicts expired keys after flush', () => {
    rs.useFakeTimers();
    try {
      const emitted: Array<{ payload: number; suppressed: number }> = [];
      const throttle = createWindowedThrottle<number>({
        windowMs: 5_000,
        autoFlush: true,
        onEmit: (payload, suppressed) => {
          emitted.push({ payload, suppressed });
        },
      });

      // Burst on a single key emits immediately then summarizes and deletes the key
      throttle.record('k1', 1);
      throttle.record('k1', 2);
      throttle.record('k1', 3);
      expect(emitted).toEqual([{ payload: 1, suppressed: 0 }]);
      expect(throttle.size()).toBe(1);

      rs.advanceTimersByTime(5_000);
      expect(emitted).toEqual([
        { payload: 1, suppressed: 0 },
        { payload: 3, suppressed: 2 },
      ]);
      expect(throttle.size()).toBe(0);

      // Single event without follow-up is also evicted after the window expires
      throttle.record('k2', 10);
      expect(throttle.size()).toBe(1);
      rs.advanceTimersByTime(5_000);
      expect(throttle.size()).toBe(0);
      expect(emitted).toHaveLength(3);

      // Force flush emits pending suppressed events and clears all keys immediately
      throttle.record('k3', 20);
      throttle.record('k3', 21);
      throttle.flush();
      expect(throttle.size()).toBe(0);
      expect(emitted.at(-1)).toEqual({ payload: 21, suppressed: 1 });
    } finally {
      rs.useRealTimers();
    }
  });

  it('creates scoped logger instances with automatic app field, child overrides, and log level control', () => {
    const infoSpy = rs.spyOn(logger, 'info').mockImplementation(() => {});
    const warnSpy = rs.spyOn(logger, 'warn').mockImplementation(() => {});
    const errorSpy = rs.spyOn(logger, 'error').mockImplementation(() => {});

    const scoped = createMFSSRLogger({ app: 'host', mode: 'dev' });
    scoped.info('Updating', { mode: 'dev', trigger: 'api' }, 'remote (v1->v2)');
    scoped.warn('Fallback', { scope: 'partial->full' });
    const cause = new Error('root cause');
    const err = new Error('load failed', { cause });
    scoped.error('Failed', { stage: 'rebuild' }, err);

    expect(infoSpy).toHaveBeenCalledWith(
      '[MF SSR] Updating remote (v1->v2) app=host mode=dev trigger=api',
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[MF SSR] Fallback app=host scope=partial->full',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      '[MF SSR] Failed app=host stage=rebuild',
      err,
    );
    expect((errorSpy.mock.calls[0][1] as Error).cause).toBe(cause);
    expect((errorSpy.mock.calls[0][1] as Error).stack).toContain('load failed');

    // child({ mode: 'global' }) respects MODERN_SERVER_LOG_LEVEL without affecting parent dev logger
    process.env.MODERN_SERVER_LOG_LEVEL = 'warn';
    const globalChild = scoped.child({ mode: 'global' });
    globalChild.info('Ready', { mode: 'global', scope: 'snapshot' });
    scoped.info('Ready', { mode: 'dev', scope: 'partial' });
    expect(infoSpy).toHaveBeenCalledTimes(2);
    expect(infoSpy.mock.calls[1][0]).toBe(
      '[MF SSR] Ready app=host mode=dev scope=partial',
    );

    // Custom logger and logger: false overrides
    delete process.env.MODERN_SERVER_LOG_LEVEL;
    const customWarn = rs.fn();
    const customChild = scoped.child({ logger: { warn: customWarn } });
    customChild.warn('Admission', { decision: 'reject' });
    expect(customWarn).toHaveBeenCalledWith(
      '[MF SSR] Admission app=host decision=reject',
    );
    const mutedChild = scoped.child({ logger: false });
    mutedChild.warn('Admission', { decision: 'reject' });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(customWarn).toHaveBeenCalledTimes(1);
  });
});
