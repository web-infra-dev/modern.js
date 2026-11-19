import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import next from 'next';
import { exportServiceFragment } from './export-service.mjs';

const host = process.env.MF_LAB_PUBLIC_HOST || '127.0.0.1';
const port = Number(process.env.JO_PORT_NEXT);
const origin = `http://${host}:${port}`;
const app = next({ dev: false, dir: import.meta.dirname, hostname: host, port });
await app.prepare();
const handle = app.getRequestHandler();
const bridgeRequire = createRequire(path.join(process.env.MF_RSC_BASELINE, 'packages/cli/plugin-module-federation/package.json'));
const { createBridgeServiceHandler } = bridgeRequire('@module-federation/bridge-react/service-node');
const clientRoot = path.resolve(process.env.MF_RSC_PROBE_DIST, 'v1/client');
const shell = await readFile(path.join(clientRoot, 'index.html'), 'utf8');
const buildVersion = (await readFile(path.join(import.meta.dirname, '.next/BUILD_ID'), 'utf8')).trim();

const service = createBridgeServiceHandler({
  buildVersion,
  async render(info) {
    const response = await fetch(origin, { signal: info.signal });
    if (!response.ok) throw Error(`Next.js render returned HTTP ${response.status}`);
    const { fragment, flight, stylesheets } = exportServiceFragment(await response.text());
    return {
      stylesheets: stylesheets.map(href => new URL(href, origin).href),
      stream: new Blob([fragment]).stream(),
      snapshot: Promise.resolve({ flight }),
      abort() {},
    };
  },
});

createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, origin).pathname;
    if (pathname === '/service/next') {
      const aborter = new AbortController();
      res.once('close', () => aborter.abort());
      const response = await service(new Request(origin + pathname, {
        method: req.method,
        headers: req.headers,
        signal: aborter.signal,
        ...(req.method === 'POST' ? { body: Readable.toWeb(req), duplex: 'half' } : {}),
      }));
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) await pipeline(Readable.fromWeb(response.body), res);
      else res.end();
    } else if (pathname === '/embed') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<!doctype html><body data-next-rsc-service="/_next/static/service-remote.js?v=${encodeURIComponent(buildVersion)}"><button id="load">Load Next.js Service</button><button id="unmount">Unmount</button><div id="one"></div><pre id="error"></pre>${shell.match(/<script[^>]*src="[^"]+"[^>]*><\/script>/g).join('')}`);
    } else if (pathname.startsWith('/v1/static/js/')) {
      const file = path.resolve(clientRoot, '.' + pathname.slice('/v1'.length));
      if (!file.startsWith(clientRoot + path.sep)) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', 'text/javascript');
      res.end(await readFile(file));
    } else {
      await handle(req, res);
    }
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500).end('Next.js Service failed');
    else res.destroy();
  }
}).listen(port, host, () => console.log(`Next.js Service: ${origin}/embed`));
