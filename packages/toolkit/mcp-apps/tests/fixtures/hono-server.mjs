import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { mcpApps } from '@modern-js/mcp-apps/hono';
import { bindUiResources, loadMcpAppsConfig } from '@modern-js/mcp-apps/server';
import { Hono } from 'hono';

const root = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'application',
);
const definition = await loadMcpAppsConfig(
  process.env.MCP_APPS_CONFIG ?? path.join(root, 'api/mcp_apps.js'),
);
const app = new Hono();
app.use('/static/*', serveStatic({ root }));
app.get('/health', c => c.json({ ok: true }));
app.use('/mcp', async (c, next) => {
  if (c.req.header('origin')) return c.text('Origin not allowed', 403);
  await next();
});
app.all(
  '/mcp',
  mcpApps({
    definition: bindUiResources(definition, {
      directory: path.join(root, 'mcp-apps/ui'),
      assetBase: 'request',
    }),
    serverInfo: { name: 'independent-greeting', version: '1.0.0' },
  }),
);
const hostname = process.env.HOST ?? '127.0.0.1';
const server = serve(
  { hostname, port: Number(process.env.PORT ?? 8090), fetch: app.fetch },
  info => console.log(`MCP endpoint: http://${hostname}:${info.port}/mcp`),
);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close();
    if ('closeAllConnections' in server) server.closeAllConnections();
  });
}
