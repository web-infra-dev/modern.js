import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRslib } from '@rslib/core';
import { proxyFixtureRpc } from './fixture-rpc.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = await mkdtemp(path.join(os.tmpdir(), 'modern-mcp-browser-'));
const hostPort = Number(process.env.MCP_HOST_PORT ?? 8092);
const endpoint = process.env.MCP_ENDPOINT ?? 'http://127.0.0.1:8080/mcp';
const rslib = await createRslib({
  cwd: root,
  config: {
    lib: [{ format: 'esm', syntax: 'es2022', autoExtension: true }],
    source: { entry: { host: path.join(root, 'tests/browser/host.ts') } },
    output: { target: 'web', autoExternal: false, distPath: { root: dist } },
  },
});
await rslib.build();
const html =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>MCP Apps protocol fixture</title></head><body><h1>Official SDK test host</h1><output>Loading…</output><iframe title="MCP greeting view" sandbox="allow-scripts allow-forms" style="display:block;width:680px;height:480px;border:1px solid #ddd;margin-top:20px"></iframe><script type="module" src="/host.mjs"></script></body></html>';
const escapeHtml = value =>
  value.replace(
    /[&<>"']/g,
    char =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ],
  );
const pageHtml = html.replace(
  '<output>',
  `<p>MCP endpoint: <code>${escapeHtml(endpoint)}</code></p><output>`,
);
const server = createServer(async (req, res) => {
  try {
    if (req.url === '/rpc' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const upstream = await proxyFixtureRpc(endpoint, body);
      res.writeHead(upstream.status, {
        'content-type':
          upstream.headers.get('content-type') ?? 'application/json',
      });
      res.end(await upstream.text());
    } else if (/^\/[a-zA-Z0-9_.-]+\.mjs$/.test(req.url ?? '')) {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      res.end(await readFile(path.join(dist, req.url.slice(1))));
    } else if (req.url === '/') {
      res.writeHead(200, { 'content-type': 'text/html' }).end(pageHtml);
    } else {
      res.writeHead(404).end();
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500, { 'content-type': 'application/json' }).end(
      JSON.stringify({
        error: {
          message: `Test host failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      }),
    );
  }
}).listen(hostPort, '127.0.0.1', () =>
  console.log(
    `Browser fixture: http://127.0.0.1:${hostPort}\nMCP endpoint: ${endpoint}`,
  ),
);

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(async () => {
      await rm(dist, { recursive: true, force: true });
    });
    server.closeAllConnections();
  });
}
