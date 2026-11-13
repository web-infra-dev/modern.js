import {
  type ServerPlugin,
  compatPlugin,
  createServerBase,
} from '@modern-js/server-core';

import { devRuntimeMiddlewarePlugin } from '../src/dev';
import {
  createLazyCompilationCorsMiddleware,
  getLazyCompilationPrefixes,
} from '../src/helpers';

const TRIGGER = '/_rspack/lazy/trigger';
const PROXIED_ORIGIN = 'https://www.example.com';

function getDefaultConfig() {
  return {
    html: {},
    output: {},
    source: {},
    tools: {},
    server: {},
    bff: {},
    dev: {},
    security: {},
  } as any;
}

function getDefaultAppContext() {
  return { apiDirectory: '', lambdaDirectory: '' } as any;
}

function makeCompiler(lazyCompilation: unknown) {
  return { options: { lazyCompilation } } as any;
}

describe('getLazyCompilationPrefixes', () => {
  it('returns nothing without a compiler or with lazy compilation off', () => {
    expect(getLazyCompilationPrefixes(null)).toEqual([]);
    expect(getLazyCompilationPrefixes(makeCompiler(undefined))).toEqual([]);
    expect(getLazyCompilationPrefixes(makeCompiler(false))).toEqual([]);
  });

  it('resolves the default rspack prefix and custom prefixes', () => {
    expect(getLazyCompilationPrefixes(makeCompiler({ imports: true }))).toEqual(
      [TRIGGER],
    );
    expect(
      getLazyCompilationPrefixes(makeCompiler({ prefix: '/custom/lazy' })),
    ).toEqual(['/custom/lazy']);
  });

  it('dedupes prefixes across a multi compiler', () => {
    const multi = {
      compilers: [
        makeCompiler({ imports: true }),
        makeCompiler({ imports: true, entries: false }),
        makeCompiler(false),
      ],
    } as any;
    expect(getLazyCompilationPrefixes(multi)).toEqual([TRIGGER]);
  });
});

describe('lazy-compilation CORS middleware (behavior)', () => {
  // Stand-in for rspack's lazyCompilationMiddleware: replies over the RAW
  // node response exactly like the real one (`writeHead(200)` without any
  // CORS header), so the tests exercise the same header-merging path.
  function makeRawRes() {
    const headers: Record<string, string> = {};
    return {
      headers,
      headersSent: false,
      setHeader(name: string, value: string) {
        headers[name.toLowerCase()] = value;
      },
    };
  }

  async function buildServer(compiler: any, onTrigger: () => void) {
    const server = createServerBase({
      config: getDefaultConfig(),
      appContext: getDefaultAppContext(),
      pwd: '',
    });
    const rspackLikeMiddleware = (req: any, res: any, next: () => void) => {
      if (req.url?.startsWith(TRIGGER) && req.method === 'POST') {
        onTrigger();
        // The real middleware ends the raw response here; replying via a
        // terminal hono route below keeps the assertion on the same headers.
      }
      next();
    };
    const terminal: ServerPlugin = {
      name: 'terminal',
      setup(api) {
        api.onPrepare(() => {
          const { middlewares } = api.getServerContext();
          middlewares.push({
            name: 'terminal-200',
            handler: async c => c.text('ok', 200),
          });
        });
      },
    };
    server.addPlugins([
      compatPlugin(),
      devRuntimeMiddlewarePlugin(
        {
          pwd: '',
          dev: {},
          builderDevServer: { middlewares: rspackLikeMiddleware },
        } as any,
        compiler,
      ),
      terminal,
    ]);
    await server.init();
    return server;
  }

  it('registers only when lazy compilation is enabled on the compiler', async () => {
    let names: string[] = [];
    const probe: ServerPlugin = {
      name: 'probe',
      setup(api) {
        api.onPrepare(() => {
          names = api.getServerContext().middlewares.map(m => m.name);
        });
      },
    };
    const build = async (compiler: any) => {
      const server = createServerBase({
        config: getDefaultConfig(),
        appContext: getDefaultAppContext(),
        pwd: '',
      });
      server.addPlugins([
        compatPlugin(),
        devRuntimeMiddlewarePlugin(
          {
            pwd: '',
            dev: {},
            builderDevServer: {
              middlewares: (_r: any, _s: any, n: any) => n(),
            },
          } as any,
          compiler,
        ),
        probe,
      ]);
      await server.init();
      return names;
    };

    expect(await build(makeCompiler({ imports: true }))).toContain(
      'lazy-compilation-cors',
    );
    // Registered before rsbuild-dev so the headers land first.
    const withLazy = await build(makeCompiler({ imports: true }));
    expect(withLazy.indexOf('lazy-compilation-cors')).toBeLessThan(
      withLazy.indexOf('rsbuild-dev'),
    );
    expect(await build(makeCompiler(false))).not.toContain(
      'lazy-compilation-cors',
    );
    expect(await build(null)).not.toContain('lazy-compilation-cors');
  });

  it('reflects the Origin onto the raw node response for cross-origin trigger POSTs', async () => {
    let triggered = 0;
    const server = await buildServer(makeCompiler({ imports: true }), () => {
      triggered += 1;
    });
    const rawRes = makeRawRes();

    const res = await server.request(
      TRIGGER,
      {
        method: 'POST',
        headers: { origin: PROXIED_ORIGIN, 'content-type': 'text/plain' },
        body: 'some-module-id',
      },
      { node: { req: { url: TRIGGER, method: 'POST' }, res: rawRes } },
    );

    expect(res.status).toBe(200);
    expect(triggered).toBe(1);
    expect(rawRes.headers['access-control-allow-origin']).toBe(PROXIED_ORIGIN);
    expect(rawRes.headers.vary).toBe('Origin');
  });

  it('answers CORS preflight with 204, allow headers and the PNA header', async () => {
    const server = await buildServer(makeCompiler({ imports: true }), () => {
      throw new Error('preflight must not reach the rspack middleware');
    });

    const res = await server.request(
      TRIGGER,
      {
        method: 'OPTIONS',
        headers: {
          origin: PROXIED_ORIGIN,
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type',
          'access-control-request-private-network': 'true',
        },
      },
      { node: { req: { url: TRIGGER, method: 'OPTIONS' }, res: makeRawRes() } },
    );

    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe(PROXIED_ORIGIN);
    expect(res.headers.get('access-control-allow-methods')).toContain('POST');
    expect(res.headers.get('access-control-allow-headers')).toBe(
      'content-type',
    );
    expect(res.headers.get('access-control-allow-private-network')).toBe(
      'true',
    );
    expect(res.headers.get('vary')).toBe('Origin');
  });

  it('stays silent for same-origin requests and unrelated paths', async () => {
    const server = await buildServer(makeCompiler({ imports: true }), () => {
      // trigger may fire; headers are what matters here
    });

    // Same-origin: no Origin header -> no CORS headers added.
    const sameOriginRes = makeRawRes();
    await server.request(
      TRIGGER,
      { method: 'POST', body: 'id' },
      { node: { req: { url: TRIGGER, method: 'POST' }, res: sameOriginRes } },
    );
    expect(
      sameOriginRes.headers['access-control-allow-origin'],
    ).toBeUndefined();

    // Unrelated path: cross-origin but not the lazy endpoint.
    const otherRes = makeRawRes();
    await server.request(
      '/some/asset.js',
      { method: 'GET', headers: { origin: PROXIED_ORIGIN } },
      {
        node: { req: { url: '/some/asset.js', method: 'GET' }, res: otherRes },
      },
    );
    expect(otherRes.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('honors a custom lazy compilation prefix', async () => {
    const middleware = createLazyCompilationCorsMiddleware(['/custom/lazy']);
    const rawRes = makeRawRes();
    const ctx = {
      req: {
        path: '/custom/lazy',
        method: 'POST',
        header: (name: string) =>
          name === 'origin' ? PROXIED_ORIGIN : undefined,
      },
      env: { node: { res: rawRes } },
    } as any;
    const next = rstest.fn();

    await middleware(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(rawRes.headers['access-control-allow-origin']).toBe(PROXIED_ORIGIN);
  });
});
