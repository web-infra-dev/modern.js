import 'reflect-metadata';
import type { ServerPluginAPI } from '@modern-js/server-core';
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
