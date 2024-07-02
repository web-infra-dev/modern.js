import path from 'path';
import assert from 'assert';
import http from 'http';
import { URL } from 'url';
import { Handler, Hono } from 'hono';
import { cors } from 'hono/cors';
import { getPort } from '@modern-js/utils';
import { HttpBindings, createAdaptorServer } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import type { AppTools, UserConfig } from '@modern-js/app-tools';
import { ROUTE_BASENAME } from '@modern-js/devtools-kit/node';
import type { ProxyDetail } from '@modern-js/types';
import { Plugin } from '../types';

const CLIENT_SERVE_DIR = path.resolve(
  require.resolve('@modern-js/devtools-client/package.json'),
  '../dist',
);

const cookiesServiceHandler: Handler = async c => {
  const raw = c.req.header('Cookie');
  const { parse } = await import('cookie-es');
  const cookies = raw ? parse(raw) : {};
  const body: Record<string, any> | null = await c.req.json().catch(() => null);
  if (body?.setCookies) {
    const { setCookies } = body;
    assert(typeof setCookies === 'object', 'setCookies should be object');
    for (const [k, v] of Object.entries(setCookies)) {
      assert(typeof v === 'string');
      // Expires for 30 days.
      const expires = new Date(Date.now() + 30 * 24 * 3_600_000).toUTCString();
      cookies[k] = v;
      c.header('Set-Cookie', `${k}=${v}; Expires=${expires}; Path=/`, {
        append: true,
      });
    }
  }
  return c.json({ cookies });
};

const hotUpdateHandler: Handler = async c => {
  if (process.env.NODE_ENV !== 'development') {
    return c.text('Not found', 404);
  }

  // Only proxy hot-update files in development mode.
  const filename = c.req.param('filename');
  const target = new URL(filename, 'http://127.0.0.1:8780');
  const { body, headers, status } = await fetch(target.href);

  // Remove content-encoding header to avoid decompressing twice.
  // Copy headers to avoid modifying the original headers (which is immutable).
  const newResp = c.newResponse(body, { headers, status });
  if (newResp.headers.get('content-encoding') === 'gzip') {
    newResp.headers.delete('content-encoding');
  }

  return newResp;
};

declare global {
  interface DevtoolsPluginVars {
    http?: http.Server & { port: number };
  }
}

export const pluginHttp: Plugin = {
  name: 'http',
  async setup(api) {
    if (process.env.NODE_ENV === 'production') return;

    const app = new Hono<{ Bindings: HttpBindings }>();
    app.use('*', cors());
    app.all('/api/cookies', cookiesServiceHandler);
    app.use(
      '/static/*',
      // Workaround for https://github.com/honojs/node-server/blob/dd0e0cd160b0b8f18abbcb28c5f5c39b72105d98/src/serve-static.ts#L56
      serveStatic({ root: path.relative(process.cwd(), CLIENT_SERVE_DIR) }),
    );
    app.get(':filename{.+\\.hot-update\\.\\w+$}', hotUpdateHandler);

    app.get('/manifest', async c => {
      const json = await api.vars.useManifestJson;
      return c.newResponse(json, 200, {
        'Content-Type': 'application/json',
      });
    });

    const server = createAdaptorServer({
      fetch: app.fetch,
      hostname: '127.0.0.1', // https://stackoverflow.com/questions/77142563/nodejs-18-breaks-dns-resolution-of-localhost-from-127-0-0-1-to-1
      serverOptions: {
        allowHTTP1: true,
      },
    });
    const port = await getPort(8782, { slient: true });
    assert(server instanceof http.Server, 'instance should be http.Server');
    server.listen(port);
    api.vars.http = Object.assign(server, { port });

    api.frameworkHooks.hook('config', async () => {
      const proxy = {
        [ROUTE_BASENAME]: {
          target: `http://127.0.0.1:${port}`,
          pathRewrite: { [`^${ROUTE_BASENAME}`]: '' },
          ws: true,
        },
      } as Record<string, ProxyDetail>;
      return { tools: { devServer: { proxy } } } as UserConfig<AppTools>;
    });

    api.hooks.hook('cleanup', () => {
      server.close();
    });
  },
};
