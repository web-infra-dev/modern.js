import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { McpUiResourceCsp } from '@modelcontextprotocol/ext-apps';

/** Domain values are CSP sources, never arbitrary directive fragments. */
export function sandboxCsp(csp: McpUiResourceCsp = {}) {
  const sources = (values: string[] = []) =>
    values
      .map(value => {
        if (
          !/^https?:\/\/(?:\*\.)?[a-z0-9.\-\[\]:]+\/?$/i.test(value) &&
          !/^wss?:\/\/[a-z0-9.\-\[\]:]+\/?$/i.test(value)
        ) {
          throw new Error(`Invalid CSP domain: ${value}`);
        }
        return value;
      })
      .join(' ');
  const resources = sources(csp.resourceDomains);
  return [
    "default-src 'none'",
    `script-src 'self' 'unsafe-inline' ${resources}`,
    `style-src 'self' 'unsafe-inline' ${resources}`,
    `img-src 'self' data: ${resources}`,
    `font-src ${resources || "'none'"}`,
    `media-src 'self' data: ${resources}`,
    `connect-src ${sources(csp.connectDomains) || "'none'"}`,
    `frame-src ${sources(csp.frameDomains) || "'none'"}`,
    `base-uri ${sources(csp.baseUriDomains) || "'self'"}`,
    "object-src 'none'",
    "form-action 'none'",
  ].join('; ');
}

// Trusted proxy only. Untrusted HTML is served separately with response CSP
// headers and an opaque-origin inner iframe, so it cannot access this proxy.
const proxy = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0">
<script>
const parentOrigin = new URL(location.href).searchParams.get('parentOrigin');
let view;
addEventListener('message', async event => {
  const data = event.data;
  if (!data || data.jsonrpc !== '2.0') return;
  if (event.source === parent && event.origin === parentOrigin) {
    if (data.method === 'ui/notifications/sandbox-resource-ready') {
      const response = await fetch(location.pathname + '/resource', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data.params)
      });
      if (!response.ok) return;
      const resource = await response.json();
      view?.remove();
      view = document.createElement('iframe');
      view.setAttribute('sandbox', 'allow-scripts allow-forms');
      view.style.cssText = 'width:100%;height:100vh;border:0;display:block';
      view.src = resource.url;
      document.body.append(view);
    } else if (!String(data.method || '').startsWith('ui/notifications/sandbox-')) {
      view?.contentWindow.postMessage(data, '*');
    }
  } else if (view && event.source === view.contentWindow &&
             !String(data.method || '').startsWith('ui/notifications/sandbox-')) {
    parent.postMessage(data, parentOrigin);
  }
});
parent.postMessage({jsonrpc:'2.0',method:'ui/notifications/sandbox-proxy-ready',params:{}}, parentOrigin);
</script></body></html>`;

/** Development-only, loopback sandbox on an origin distinct from the host. */
export async function startInspectorSandbox() {
  const token = randomUUID();
  const root = `/${token}`;
  const resources = new Map<
    string,
    { html: string; csp: string; expires: number }
  >();
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      if (request.method === 'GET' && url.pathname === root) {
        const parent = new URL(url.searchParams.get('parentOrigin') ?? '');
        if (!['http:', 'https:'].includes(parent.protocol))
          throw new Error('Invalid parent');
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.setHeader(
          'Content-Security-Policy',
          `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-src 'self'; frame-ancestors ${parent.origin}`,
        );
        response.end(proxy);
        return;
      }
      if (request.method === 'POST' && url.pathname === `${root}/resource`) {
        if (
          request.headers.origin !== `http://${request.headers.host}` ||
          request.headers['content-type'] !== 'application/json'
        ) {
          response.writeHead(403).end();
          return;
        }
        let body = '';
        for await (const chunk of request) {
          body += chunk;
          if (Buffer.byteLength(body) > 10 * 1024 * 1024)
            throw new Error('Resource too large');
        }
        const data = JSON.parse(body);
        if (typeof data.html !== 'string') throw new Error('Missing HTML');
        const id = randomUUID();
        for (const [key, value] of resources)
          if (value.expires < Date.now()) resources.delete(key);
        if (resources.size >= 32)
          resources.delete(resources.keys().next().value!);
        resources.set(id, {
          html: data.html,
          csp: sandboxCsp(data.csp),
          expires: Date.now() + 300_000,
        });
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ url: `${root}/resource/${id}` }));
        return;
      }
      const resource = resources.get(
        url.pathname.replace(`${root}/resource/`, ''),
      );
      if (
        request.method === 'GET' &&
        url.pathname.startsWith(`${root}/resource/`) &&
        resource &&
        resource.expires > Date.now()
      ) {
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.setHeader('Content-Security-Policy', resource.csp);
        response.setHeader(
          'Permissions-Policy',
          'camera=(), microphone=(), geolocation=(), clipboard-write=()',
        );
        response.end(resource.html);
        return;
      }
      response.writeHead(404).end();
    } catch {
      response.writeHead(400).end('Invalid sandbox resource');
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  server.unref();
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Sandbox failed to listen');
  return {
    url: `http://127.0.0.1:${address.port}${root}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}
