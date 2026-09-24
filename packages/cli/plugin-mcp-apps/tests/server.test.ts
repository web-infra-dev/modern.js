import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServerBase } from '@modern-js/server-core';
import { createNodeServer } from '@modern-js/server-core/node';
import { afterEach, describe, expect, it, rstest } from '@rstest/core';
import mcpPlugin, { createArtifactHandler } from '../src/server';

const dirs: string[] = [];
afterEach(async () => {
  rstest.unstubAllEnvs();
  await Promise.all(
    dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })),
  );
});
async function fixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'modern-mcp-plugin-'));
  dirs.push(dir);
  await mkdir(path.join(dir, 'dist/mcp-apps'), { recursive: true });
  const entry = path.join(dir, 'dist/mcp-apps/mcp_apps.mjs');
  await writeFile(
    entry,
    `export default { remotes: [], tools: [{ name: 'who', handler: (_, ctx) => ({ content: [], structuredContent: { user: ctx.context.get('user'), version: 'first' } }) }] };`,
  );
  return { dir, entry };
}
function call(user = 'Ada') {
  return new Request('http://localhost/mcp', {
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
      params: { name: 'who' },
    }),
  });
}

describe('Modern.js server integration', () => {
  it('reads a POST body through the real Modern.js Node request proxy', async () => {
    const f = await fixture();
    const h = createArtifactHandler(f.entry, { development: false });
    const server = await createNodeServer(request =>
      h.handle(request, new Map([['user', 'Node']])),
    );
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string')
        throw new Error('Missing address');
      const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'who' },
        }),
        signal: AbortSignal.timeout(3000),
      });
      expect((await response.json()).result.structuredContent.user).toBe(
        'Node',
      );
    } finally {
      h.reset();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
  it('uses distDirectory in production and preserves middleware, normal routes and per-request Hono context', async () => {
    const f = await fixture();
    rstest.stubEnv('NODE_ENV', 'production');
    const server = createServerBase({
      pwd: path.join(f.dir, 'dist'),
      appContext: {
        appDirectory: '/not-the-source',
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
      {
        name: 'test-middleware',
        setup(api) {
          api.onPrepare(() => {
            api.getServerContext().middlewares.push({
              name: 'auth',
              handler: async (c, next) => {
                if (c.req.header('x-user') === 'denied')
                  return c.text('Denied', 401);
                c.set('user', c.req.header('x-user'));
                return next();
              },
            });
            api.getServerContext().middlewares.push({
              name: 'render',
              handler: c => c.text('ordinary page'),
            });
          });
        },
      },
      mcpPlugin(),
    ]);
    await server.init();
    const results = await Promise.all(
      ['Ada', 'Grace'].map(
        async user =>
          (await (await server.handle(call(user))).json()).result
            .structuredContent.user,
      ),
    );
    expect(results).toEqual(['Ada', 'Grace']);
    expect((await server.handle(call('denied'))).status).toBe(401);
    expect(
      await (
        await server.handle(new Request('http://localhost/mcp-extra'))
      ).text(),
    ).toBe('ordinary page');
    expect(
      (await server.handle(new Request('http://localhost/mcp'))).status,
    ).toBe(405);
  });
});
