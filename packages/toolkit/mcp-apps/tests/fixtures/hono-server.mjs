import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { mcpApps } from '@modern-js/mcp-apps/hono';
import { Hono } from 'hono';

const app = new Hono();
app.get('/health', c => c.json({ ok: true }));
// Install your authentication/origin middleware before this route when hosting.
app.use('/mcp', async (c, next) => {
  if (c.req.header('origin')) return c.text('Origin not allowed', 403);
  await next();
});
app.all(
  '/mcp',
  mcpApps({
    configPath:
      process.env.MCP_APPS_CONFIG ??
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        'mcp-apps/mcp_apps.mjs',
      ),
    serverInfo: { name: 'independent-greeting', version: '1.0.0' },
  }),
);
const hostname = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 8090);
const server = serve({ hostname, port, fetch: app.fetch }, info =>
  console.log(`MCP endpoint: http://${hostname}:${info.port}/mcp`),
);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close();
    if ('closeAllConnections' in server) server.closeAllConnections();
  });
}
