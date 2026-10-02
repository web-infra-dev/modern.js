import { RenderLevel } from '../../../../src/core/constants';
import { SSR_DATA_PLACEHOLDER } from '../../../../src/core/server/constants';
import { buildShellAfterTemplate } from '../../../../src/core/server/stream/afterTemplate';
import { SSRDataCollector } from '../../../../src/core/server/string/ssrData';

describe('SSRDataCollector (stream parity)', () => {
  it('should strip denylisted headers from serialized SSR data script', () => {
    const chunkSet = {
      renderLevel: RenderLevel.SERVER_RENDER,
      ssrScripts: '',
      jsChunk: '',
      cssChunk: '',
    };

    const collector = new SSRDataCollector({
      runtimeContext: {
        initialData: {},
        __i18nData__: {},
      } as any,
      request: new Request('http://localhost/'),
      chunkSet,
      ssrContext: {
        request: {
          params: {},
          query: {},
          pathname: '/',
          host: 'localhost',
          url: 'http://localhost/',
          headers: {
            authorization: 'Bearer secret',
            cookie: 'sid=abc',
            'x-request-id': 'req-1',
            'x-internal-secret': 'hidden',
          },
        },
        reporter: { sessionId: 'session-1' },
      } as any,
      ssrConfig: {
        unsafeHeaders: ['x-request-id'],
      } as any,
    });

    collector.effect();

    expect(chunkSet.ssrScripts).toMatch('"x-request-id":"req-1"');
    expect(chunkSet.ssrScripts).not.toMatch('authorization');
    expect(chunkSet.ssrScripts).not.toMatch('cookie');
    expect(chunkSet.ssrScripts).not.toMatch('x-internal-secret');
  });

  it('should append router hydration script from the shared router snapshot', () => {
    const chunkSet = {
      renderLevel: RenderLevel.SERVER_RENDER,
      ssrScripts: '',
      jsChunk: '',
      cssChunk: '',
    };

    const collector = new SSRDataCollector({
      runtimeContext: {
        initialData: {},
        __i18nData__: {},
        routerServerSnapshot: {
          hydrationScript: '<script>window.__HYDRATE__ = "router";</script>',
        },
      } as any,
      request: new Request('http://localhost/'),
      chunkSet,
      ssrContext: {
        request: {
          params: {},
          query: {},
          pathname: '/',
          host: 'localhost',
          url: 'http://localhost/',
          headers: {},
        },
        reporter: { sessionId: 'session-1' },
      } as any,
      ssrConfig: {} as any,
    });

    collector.effect();

    expect(chunkSet.ssrScripts).toContain('window.__HYDRATE__ = "router";');
  });

  it('should inject generic router hydration scripts into stream templates', async () => {
    const html = await buildShellAfterTemplate(SSR_DATA_PLACEHOLDER, {
      entryName: 'main',
      renderLevel: RenderLevel.SERVER_RENDER,
      request: new Request('http://localhost/'),
      runtimeContext: {
        initialData: {},
        __i18nData__: {},
        routeManifest: {},
        ssrContext: {
          request: {
            params: {},
            query: {},
            pathname: '/',
            host: 'localhost',
            url: 'http://localhost/',
            headers: {},
          },
          reporter: { sessionId: 'session-1' },
        },
        routerServerSnapshot: {
          hydrationScripts: [
            '<script>window.__STREAM_ROUTER_A__ = true;</script>',
            '<script>window.__STREAM_ROUTER_B__ = true;</script>',
          ],
        },
      } as any,
      ssrConfig: {} as any,
      config: {} as any,
    });

    expect(html).toContain('window.__STREAM_ROUTER_A__ = true;');
    expect(html).toContain('window.__STREAM_ROUTER_B__ = true;');
  });
});
