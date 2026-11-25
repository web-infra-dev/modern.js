import { debug, logger } from '@modern-js/utils';
import {
  debugMFSSR,
  extractTargetVersion,
  formatErrorMessage,
  formatLogFields,
  formatRemoteTransitions,
  formatTimings,
  isMFSSRDebugEnabled,
  isMFSSRLogged,
  logMFSSR,
  markMFSSRLogged,
  mfSSRDebug,
} from './ssrLogger';

describe('ssrLogger', () => {
  afterEach(() => {
    rs.restoreAllMocks();
    debug.disable();
  });

  it('formats single-line logfmt fields, skipping empty values and escaping special characters', () => {
    expect(
      formatLogFields({
        mode: 'dev',
        scope: 'partial',
        entries: ['main', 'weather'],
        emptyArr: [],
        emptyStr: '',
        missing: undefined,
        nil: null,
        durationMs: 42.6,
        ok: true,
        reason: 'Shared manifests changed\nduring "selective" update',
      }),
    ).toBe(
      'mode=dev scope=partial entries=main,weather durationMs=43 ok=true reason="Shared manifests changed during \\"selective\\" update"',
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

  it('formats AggregateError messages cleanly and tracks logged markers', () => {
    const err = new AggregateError(
      [new Error('first failure'), new Error('second failure')],
      'SSR update failed',
    );
    expect(formatErrorMessage(err)).toBe(
      'SSR update failed: first failure; second failure',
    );
    expect(isMFSSRLogged(err)).toBe(false);
    markMFSSRLogged(err);
    expect(isMFSSRLogged(err)).toBe(true);
  });

  it('emits structured [MF SSR] info/warn/error lines through Modern logger', () => {
    const infoSpy = rs.spyOn(logger, 'info').mockImplementation(() => {});
    const warnSpy = rs.spyOn(logger, 'warn').mockImplementation(() => {});

    logMFSSR(
      'info',
      'Updating',
      { mode: 'dev', trigger: 'hmr-check', app: 'host', op: '1:2' },
      'remote-a (v1->v2)',
    );
    logMFSSR('warn', 'Manifest 503', {
      path: '/static/mf-manifest.json',
      reason: 'wait-timeout',
      waitedMs: 30001,
    });

    expect(infoSpy).toHaveBeenCalledWith(
      '[MF SSR] Updating remote-a (v1->v2) mode=dev trigger=hmr-check app=host op=1:2',
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[MF SSR] Manifest 503 path=/static/mf-manifest.json reason=wait-timeout waitedMs=30001',
    );
  });

  it('uses native Modern.js DEBUG=modern-js:mf-ssr namespace for debug logs', () => {
    debug.disable();
    expect(isMFSSRDebugEnabled()).toBe(false);

    const emitted: string[] = [];
    const originalLog = debug.log;
    debug.log = (...args: any[]) => {
      emitted.push(String(args[0]));
    };
    try {
      debugMFSSR('check-noop', { trigger: 'request', remotes: ['a@v1'] });
      expect(emitted).toHaveLength(0);

      debug.enable('modern-js:mf-ssr');
      expect(mfSSRDebug.enabled).toBe(true);
      expect(isMFSSRDebugEnabled()).toBe(true);

      debugMFSSR('check-noop', { trigger: 'request', remotes: ['a@v1'] });
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toContain('modern-js:mf-ssr');
      expect(emitted[0]).toContain('check-noop trigger=request remotes=a@v1');
    } finally {
      debug.log = originalLog;
    }
  });
});
