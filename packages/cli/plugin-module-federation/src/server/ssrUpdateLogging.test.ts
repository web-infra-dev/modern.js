import { debug, logger } from '@modern-js/utils';
import { createDevManifestPublication } from '../cli/devManifest';
import { createSSRUpdateAdapter } from './ssrUpdate';
import { startDevRemoteUpdates } from './devRemoteUpdates';
import { isMFSSRLogged } from './ssrLogger';

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

describe('MF SSR update logging', () => {
  afterEach(() => {
    rs.restoreAllMocks();
    debug.disable();
  });

  it('logs Updating and Ready with version transition, scope, reason, and timings in prod mode', async () => {
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
    const application = {
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

    const result = await adapter.updateRemotes(
      application as any,
      [
        {
          name: 'provider',
          entry,
          manifest: manifest('provider', 'v2', entry),
        },
      ],
      { trigger: 'api' },
    );

    expect(result.changed).toBe(true);
    expect(infoSpy).toHaveBeenCalledTimes(2);
    expect(infoSpy.mock.calls[0][0]).toContain(
      '[MF SSR] Updating provider (v1->v2) mode=prod trigger=api app=host',
    );
    expect(infoSpy.mock.calls[1][0]).toContain(
      '[MF SSR] Ready provider mode=prod scope=full',
    );
    expect(infoSpy.mock.calls[1][0]).toContain('gen=1');
    expect(infoSpy.mock.calls[1][0]).toContain('app=host');
  });

  it('logs structured Failed error and marks it as logged to prevent duplicate reporting', async () => {
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
    const application = {
      status: { phase: 'serving', generation: 0 },
      async update() {
        this.status.phase = 'unavailable';
        throw new Error('bundle load failed');
      },
    };

    let caught: unknown;
    try {
      await adapter.updateRemotes(
        application as any,
        [
          {
            name: 'provider',
            entry,
            manifest: manifest('provider', 'v2', entry),
          },
        ],
        { trigger: 'hmr-check' },
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(isMFSSRLogged(caught)).toBe(true);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain('[MF SSR] Failed');
    expect(errorSpy.mock.calls[0][0]).toContain('remotes=provider');
    expect(errorSpy.mock.calls[0][0]).toContain('mode=dev');
    expect(errorSpy.mock.calls[0][0]).toContain('phase=unavailable');
    expect(errorSpy.mock.calls[0][0]).toContain('error="bundle load failed"');
  });

  it('emits check-noop and manifest-ready debug logs only when DEBUG=modern-js:mf-ssr is enabled', async () => {
    const entry = 'http://provider.test/static/mf-manifest.json';
    const v1 = manifest('provider', 'v1', entry);
    rs.spyOn(globalThis, 'fetch').mockResolvedValue(
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
      debug.enable('modern-js:mf-ssr');
      const watcher = startDevRemoteUpdates({
        remotes: [{ name: 'provider', entry }],
        shouldUpdateRemote: async () => false,
        updateRemotes: async () => {},
        onApplied: () => {},
        onError: () => {},
      });

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

      const publication = createDevManifestPublication();
      const hooks = {
        thisCompilation: { tap: (_opt: any, cb: any) => cb(compilation) },
        invalid: { tap: () => {} },
      };
      const compilation = {};
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
});
