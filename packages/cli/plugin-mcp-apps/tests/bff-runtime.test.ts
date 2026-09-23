import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { compileMcpApps } from '@modern-js/mcp-apps/build';
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
  const endpoint = mcpApps({ serverInfo: { name: 'bff-test', version: '1' } });
  const create = async (name: string) => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), 'modern-mcp-bff-runtime-'),
    );
    directories.push(root);
    await writeFile(
      path.join(root, 'mcp_apps.ts'),
      `export default { remotes: [], tools: [{ name: 'who', handler: { module: './tool' } }] };`,
    );
    await writeFile(
      path.join(root, 'tool.ts'),
      `export default (_, ctx) => ({ content: [], structuredContent: { app: '${name}', user: ctx.context.req.header('x-user') } });`,
    );
    await compileMcpApps({
      configPath: path.join(root, 'mcp_apps.ts'),
      outDir: path.join(root, 'custom-output/mcp-apps'),
    });
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
        entry: 'mcp-apps/mcp_apps.mjs',
        devEntry: 'unused',
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
