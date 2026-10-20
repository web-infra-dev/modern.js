import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  type ServerPlugin,
  compatPlugin,
  createServerBase,
} from '@modern-js/server-core';
import { afterEach, expect, it } from '@rstest/core';
import { HonoAdapter } from '../../plugin-bff/src/runtime/hono/adapter';
import { mcpApps } from '../src/bff';
import mcpBffRuntime from '../src/bff-runtime';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(dir => rm(dir, { recursive: true, force: true })),
  );
});

it('binds the same declaration independently per BFF runtime without adding an MCP middleware', async () => {
  const create = async (name: string) => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), 'modern-mcp-bff-runtime-'),
    );
    directories.push(root);
    const endpoint = mcpApps(
      {
        remotes: [],
        tools: [
          {
            name: 'who',
            handler: (_, ctx) => ({
              content: [],
              structuredContent: {
                app: name,
                user: (
                  ctx.context as { req: { header: (key: string) => string } }
                ).req.header('x-user'),
              },
            }),
          },
        ],
      },
      { serverInfo: { name: 'bff-test', version: '1' } },
    );
    const bff: ServerPlugin = {
      name: '@modern-js/plugin-bff',
      setup(api) {
        api.onPrepare(async () => {
          api.updateServerContext({
            ...api.getServerContext(),
            apiHandlerInfos: Object.entries(endpoint).map(
              ([httpMethod, handler]) => ({
                routePath: '/custom/nested/mcp',
                httpMethod,
                handler,
              }),
            ),
          });
          await api.getHooks().prepareApiServer.call({
            pwd: path.join(root, 'custom-output'),
            prefix: '/custom',
          });
          expect(api.getServerContext().middlewares).toHaveLength(0);
          await new HonoAdapter(api).registerMiddleware();
        });
      },
    };
    const server = createServerBase({
      pwd: path.join(root, 'custom-output'),
      appContext: {
        apiDirectory: '',
        lambdaDirectory: '',
        bffRuntimeFramework: 'hono',
      },
      config: {
        html: {},
        output: {},
        source: {},
        tools: {},
        server: {},
        bff: {},
        dev: {},
        security: {},
      },
    });
    server.addPlugins([
      compatPlugin(),
      bff,
      mcpBffRuntime({
        development: false,
        config: 'mcp_apps.ts',
        resourceDirectory: 'mcp-apps/ui',
        assetBase: 'request',
      }),
    ]);
    await server.init();
    return server;
  };
  const first = await create('first');
  const second = await create('second');
  const responses = await Promise.all(
    [first, second].map(async (server, i) => {
      const response = await server.request('/custom/nested/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          'x-user': `user-${i}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'who' },
        }),
      });
      expect(response.status).toBe(200);
      return (await response.json()).result.structuredContent;
    }),
  );
  expect(responses).toEqual([
    { app: 'first', user: 'user-0' },
    { app: 'second', user: 'user-1' },
  ]);
  expect((await first.request('/custom/nested/mcp')).status).toBe(405);
  expect((await first.request('/custom/nested/mcp-extra')).status).toBe(404);
});

for (const mode of ['js', 'mjs', 'local-mf', 'custom-mf']) {
  const localMf = mode === 'local-mf' || mode === 'custom-mf';
  const extension = localMf ? 'js' : mode;
  it(`automatically mounts a compiled ${mode} definition alongside ordinary BFF routes`, async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'modern-mcp-auto-'));
    directories.push(root);
    const dist = path.join(root, 'dist');
    const { mkdir, writeFile } = await import('node:fs/promises');
    await mkdir(dist);
    let definition = `{ name: 'automatic', version: '2', remotes: [{ name: 'ui', baseUrl: 'https://ui.example/static/mf-manifest.json' }], tools: [{ name: 'who', remote: 'ui', view: { module: './Who' }, inputSchema: { name: { type: 'string' } }, handler: ({ name }, ctx) => ({ structuredContent: { name, user: ctx.context.req.header('x-user') } }) }] }`;
    if (localMf) {
      definition = definition.replace(
        "remotes: [{ name: 'ui', baseUrl: 'https://ui.example/static/mf-manifest.json' }]",
        'remotes: []',
      );
      await mkdir(path.join(dist, 'mcp-apps/ui'), { recursive: true });
      if (mode === 'custom-mf') {
        await mkdir(path.join(dist, 'federation'), { recursive: true });
        await mkdir(path.join(dist, 'chunks'), { recursive: true });
        await writeFile(
          path.join(dist, 'federation/manifest.json'),
          '{"name":"ui"}',
        );
        await writeFile(
          path.join(dist, 'chunks/remote.js'),
          'export default "remote";',
        );
        await writeFile(path.join(dist, 'secret.js'), 'private server code');
      }
      await writeFile(
        path.join(dist, 'mcp-apps/ui/mf-remotes.json'),
        JSON.stringify([
          {
            name: 'ui',
            manifest:
              mode === 'custom-mf'
                ? 'federation/manifest.json'
                : 'static/mf-manifest.json',
            publicPath:
              mode === 'custom-mf'
                ? '/widgets/'
                : 'https://cdn.example/release/',
            assets: ['federation/manifest.json', 'chunks/remote.js'],
          },
        ]),
      );
    }
    await writeFile(
      path.join(dist, `mcp_apps.${extension}`),
      extension === 'mjs'
        ? `export default ${definition}`
        : `module.exports = ${definition}`,
    );
    let addConflict = () => {};
    const server = createServerBase({
      pwd: dist,
      appContext: {
        bffRuntimeFramework: 'hono',
        apiDirectory: '',
        lambdaDirectory: '',
      },
      config: {
        html: {},
        output: {},
        source: {},
        tools: {},
        server: {},
        bff: {},
        dev: {},
        security: {},
      },
    });
    server.addPlugins([
      compatPlugin(),
      {
        name: '@modern-js/plugin-bff',
        setup(api) {
          addConflict = () => {
            const ctx = api.getServerContext();
            api.updateServerContext({
              ...ctx,
              apiHandlerInfos: [
                ...(ctx.apiHandlerInfos ?? []),
                {
                  routePath: '/custom/mcp',
                  httpMethod: 'POST',
                  handler: () => ({}),
                },
              ],
            });
          };
          api.onPrepare(async () => {
            api.updateServerContext({
              ...api.getServerContext(),
              apiHandlerInfos: [
                {
                  routePath: '/api/status',
                  httpMethod: 'GET',
                  handler: () => ({ ok: true }),
                },
              ],
            });
            await api
              .getHooks()
              .prepareApiServer.call({ pwd: dist, prefix: '/api' });
            await new HonoAdapter(api).registerMiddleware();
          });
        },
      },
      mcpBffRuntime(
        {
          development: false,
          config: extension === 'mjs' ? 'mcp_apps.mts' : 'mcp_apps.ts',
          endpoint: '/custom/mcp',
          resourceDirectory: 'mcp-apps/ui',
          assetBase: 'request',
        },
        {
          transformResponse(response, context) {
            response.headers.set(
              'x-mcp-user',
              context.req.raw.headers.get('x-user') ?? 'anonymous',
            );
            return response;
          },
        },
      ),
    ]);
    await server.init();
    expect(await (await server.request('/api/status')).json()).toEqual({
      ok: true,
    });
    expect((await server.request('/custom/mcp')).status).toBe(405);
    const preflight = await server.request('/static/mf-manifest.json', {
      method: 'OPTIONS',
      headers: {
        Origin: 'null',
        'Access-Control-Request-Private-Network': 'true',
      },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(preflight.headers.get('Access-Control-Allow-Private-Network')).toBe(
      'true',
    );
    expect(
      (await server.request('/api/status')).headers.get(
        'Access-Control-Allow-Origin',
      ),
    ).toBeNull();
    expect(
      (await server.request('/custom/mcp')).headers.get(
        'Access-Control-Allow-Origin',
      ),
    ).toBeNull();
    if (mode === 'custom-mf') {
      const manifest = await server.request(
        '/widgets/federation/manifest.json',
      );
      expect(manifest.headers.get('Content-Type')).toBe('application/json');
      expect(await manifest.json()).toEqual({ name: 'ui' });
      const remote = await server.request('/widgets/chunks/remote.js');
      expect(await remote.text()).toBe('export default "remote";');
      expect(remote.headers.get('Access-Control-Allow-Origin')).toBe('*');
      const head = await server.request('/widgets/chunks/remote.js', {
        method: 'HEAD',
      });
      expect(await head.text()).toBe('');
      expect(head.headers.get('Content-Length')).toBe(
        String(Buffer.byteLength('export default "remote";')),
      );
      expect((await server.request('/widgets/secret.js')).status).toBe(404);
      for (const pathname of [
        '/widgets/federation/manifest.json',
        '/widgets/chunks/remote.js',
      ]) {
        const response = await server.request(pathname, { method: 'OPTIONS' });
        expect(response.status).toBe(204);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      }
      expect(
        (
          await server.request('/widgets/unrelated.js', { method: 'OPTIONS' })
        ).headers.get('Access-Control-Allow-Origin'),
      ).toBeNull();
    }
    expect((await server.request('/custom/mcp-extra')).status).toBe(404);
    for (const [name, user] of [
      ['Ada', 'one'],
      ['Bob', 'two'],
    ]) {
      const response = await server.request('/custom/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          'x-user': user,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'who', arguments: { name } },
        }),
      });
      expect(response.headers.get('x-mcp-user')).toBe(user);
      const content = (await response.json()).result.structuredContent;
      if (localMf) {
        expect(content.resource.moduleFederation.remoteEntry).toBe(
          mode === 'custom-mf'
            ? 'http://localhost/widgets/federation/manifest.json'
            : 'https://cdn.example/release/static/mf-manifest.json',
        );
        expect(content.resource.csp.resourceDomains).toEqual([
          mode === 'custom-mf' ? 'http://localhost' : 'https://cdn.example',
        ]);
      }
      expect(content).toMatchObject({
        name,
        user,
      });
    }
    addConflict();
    await expect(
      server.hooks.onReset.call({
        event: { type: 'file-change', payload: [] },
      }),
    ).rejects.toThrow('MCP endpoint conflicts');
  });
}
