import 'reflect-metadata';
import {
  type ServerPlugin,
  type ServerPluginAPI,
  compatPlugin,
  createServerBase,
} from '@modern-js/server-core';
import { HonoAdapter } from '../src/runtime/hono/adapter';

const before = ['custom-server-hook', 'custom-server-middleware', 'render'];

const sampleApiHandlerInfos = [
  { handler: () => ({ id: 'foo' }), routePath: '/api/foo', httpMethod: 'GET' },
  { handler: () => ({ id: 'bar' }), routePath: '/api/bar', httpMethod: 'POST' },
] as any;

function createMockApi(overrides: {
  bffRuntimeFramework?: string;
  apiHandlerInfos?: any;
  middlewares: any[];
}): ServerPluginAPI {
  const context = {
    bffRuntimeFramework: overrides.bffRuntimeFramework ?? 'hono',
    apiHandlerInfos: overrides.apiHandlerInfos ?? sampleApiHandlerInfos,
    middlewares: overrides.middlewares,
  };
  return {
    getServerContext: () => context,
  } as unknown as ServerPluginAPI;
}

describe('HonoAdapter.registerMiddleware (dev/prod unified path)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  async function register(nodeEnv: string) {
    process.env.NODE_ENV = nodeEnv;
    const middlewares: any[] = [];
    const adapter = new HonoAdapter(createMockApi({ middlewares }));
    await adapter.registerMiddleware();
    return middlewares;
  }

  it('registers the API routes directly and never the dev-only dynamic-bff-handler', async () => {
    const middlewares = await register('development');

    const names = middlewares.map(m => m.name);
    expect(names).toEqual(['hono-bff-api', 'hono-bff-api']);
    expect(names).not.toContain('dynamic-bff-handler');

    // path / method / order / before are preserved for routing + ordering.
    expect(
      middlewares.map(m => ({
        method: m.method,
        path: m.path,
        order: m.order,
        before: m.before,
      })),
    ).toEqual([
      { method: 'get', path: '/api/foo', order: 'post', before },
      { method: 'post', path: '/api/bar', order: 'post', before },
    ]);
  });

  it('produces an identical registration in dev and prod', async () => {
    const devMiddlewares = await register('development');
    const prodMiddlewares = await register('production');

    const shape = (list: any[]) =>
      list.map(m => ({ name: m.name, method: m.method, path: m.path }));

    expect(shape(devMiddlewares)).toEqual(shape(prodMiddlewares));
    expect(shape(devMiddlewares)).toEqual([
      { name: 'hono-bff-api', method: 'get', path: '/api/foo' },
      { name: 'hono-bff-api', method: 'post', path: '/api/bar' },
    ]);
  });

  it('registers nothing when the BFF runtime framework is not hono', async () => {
    const middlewares: any[] = [];
    const adapter = new HonoAdapter(
      createMockApi({ bffRuntimeFramework: 'express', middlewares }),
    );

    await adapter.registerMiddleware();

    expect(adapter.isHono).toBe(false);
    expect(middlewares).toHaveLength(0);
  });
});

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

/**
 * Inject API handler infos into the server context, then register them through
 * the (Phase 4) unified HonoAdapter path — exactly what the BFF plugin does on
 * every runtime build.
 */
function bffRoutesPlugin(apiHandlerInfos: any[]): ServerPlugin {
  return {
    name: 'test-bff-routes',
    setup(api) {
      api.onPrepare(async () => {
        const ctx = api.getServerContext();
        api.updateServerContext({ ...ctx, apiHandlerInfos });
        await new HonoAdapter(api).registerMiddleware();
      });
    },
  };
}

/**
 * A catch-all middleware named `render` so the `hono-bff-api` routes
 * (before: ['render']) are ordered ahead of it — mirroring the real SSR fallback.
 */
function renderPlugin(): ServerPlugin {
  return {
    name: 'test-render',
    setup(api) {
      api.onPrepare(() => {
        const { middlewares } = api.getServerContext();
        middlewares.push({
          name: 'render',
          path: '*',
          method: 'all',
          order: 'post',
          handler: (c: any) => c.json({ served: 'render' }),
        });
      });
    },
  };
}

async function buildServer(prefix: string) {
  const server = createServerBase({
    config: getDefaultConfig(),
    pwd: '',
    appContext: {
      apiDirectory: '',
      lambdaDirectory: '',
      bffRuntimeFramework: 'hono',
    } as any,
  });
  const apiHandlerInfos = [
    {
      routePath: `${prefix}/hello`,
      httpMethod: 'GET',
      handler: () => ({ msg: 'hello' }),
    },
  ];
  server.addPlugins([
    compatPlugin(),
    bffRoutesPlugin(apiHandlerInfos),
    renderPlugin(),
  ]);
  await server.init();
  return server;
}

describe('BFF API route dispatch through ServerBase (dev == prod path)', () => {
  it('serves a matching API route under a custom prefix', async () => {
    const server = await buildServer('/custom-api');

    const res = await server.request('/custom-api/hello');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ msg: 'hello' });
  });

  it('falls through to render when an API path does not match (no truncation)', async () => {
    const server = await buildServer('/api');

    const res = await server.request('/api/not-exist');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ served: 'render' });
  });

  it('does not intercept non-API paths', async () => {
    const server = await buildServer('/api');

    const res = await server.request('/some/page');

    expect(await res.json()).toEqual({ served: 'render' });
  });
});
