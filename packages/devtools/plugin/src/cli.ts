import http from 'http';
import path from 'path';
import assert from 'assert';
import { URL } from 'url';
import _ from '@modern-js/utils/lodash';
import { ProxyDetail } from '@modern-js/types';
import { fs, getPort, logger } from '@modern-js/utils';
import { Context, Hono } from 'hono';
import { serve, HttpBindings } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { ClientDefinition, ROUTE_BASENAME } from '@modern-js/devtools-kit/node';
import {
  DevtoolsPluginOptions,
  resolveContext,
  updateContext,
} from './options';
import { setupClientConnection } from './rpc';
import { SocketServer } from './utils/socket';
import { loadConfigFiles } from './utils/config';

export type { DevtoolsPluginOptions };

export type DevtoolsPlugin = CliPlugin<AppTools> & {
  setClientDefinition: (def: ClientDefinition) => void;
};

export const devtoolsPlugin = (
  inlineOptions: DevtoolsPluginOptions = {},
): DevtoolsPlugin => {
  const ctx = resolveContext(inlineOptions);
  return {
    name: '@modern-js/plugin-devtools',
    usePlugins: [],
    setClientDefinition(def) {
      Object.assign(ctx.def, def);
    },
    async setup(api) {
      if (!ctx.enable) return {};

      const httpServer = await setupHttpServer();
      const socketServer = new SocketServer({
        server: httpServer.instance,
        path: '/rpc',
      });
      const rpc = await setupClientConnection({
        api,
        ctx,
        server: socketServer,
      });

      return {
        prepare: rpc.hooks.prepare,
        modifyFileSystemRoutes: rpc.hooks.modifyFileSystemRoutes,
        beforeRestart() {
          return new Promise((resolve, reject) =>
            httpServer.instance.close(err => (err ? reject(err) : resolve())),
          );
        },
        modifyServerRoutes({ routes }) {
          routes.push({
            urlPath: '/sw-proxy.js',
            isSPA: true,
            isSSR: false,
            entryPath: 'public/sw-proxy.js',
          });
          return { routes };
        },
        async config() {
          const appConfig = api.useConfigContext();
          const appCtx = api.useAppContext();
          const { devtools: options = {} } = appConfig;
          updateContext(ctx, options);
          const configs = await loadConfigFiles(appCtx.appDirectory);
          updateContext(ctx, ...configs);
          logger.info(`${ctx.def.name.formalName} DevTools is enabled`);

          const swProxyEntry = require.resolve(
            '@modern-js/devtools-client/sw-proxy',
          );

          // Inject options to client.
          const clientOptions = _.pick(ctx, ['def', 'endpoint', 'dataSource']);
          // Keep resource query always existing.
          Object.assign(clientOptions, { __keep: true });
          const serializedOptions = JSON.stringify(clientOptions);
          const tags: AppTools['normalizedConfig']['html']['tags'] = [
            {
              tag: 'script',
              children: `window.__MODERN_JS_DEVTOOLS_OPTIONS__ = ${serializedOptions};`,
              head: true,
              append: false,
            },
          ];

          const styles: string[] = [];
          const manifest = require('@modern-js/devtools-client/manifest');
          // Inject JavaScript chunks to client.
          for (const src of manifest.routeAssets.mount.assets) {
            assert(typeof src === 'string');
            if (src.endsWith('.js')) {
              tags.push({
                tag: 'script',
                attrs: { src },
                head: true,
                append: false,
              });
            } else if (src.endsWith('.css')) {
              styles.push(src);
            }
          }
          // Inject CSS chunks to client inside of template to avoid polluting global.
          tags.push({
            tag: 'template',
            attrs: { id: '_modern_js_devtools_styles' },
            append: true,
            head: false,
            children: styles
              .map(src => `<link rel="stylesheet" href="${src}">`)
              .join(''),
          });

          return {
            builderPlugins: [rpc.builderPlugin],
            source: {},
            output: {
              copy: [{ from: swProxyEntry, to: 'public' }],
            },
            html: { tags },
            tools: {
              devServer: {
                proxy: {
                  [ROUTE_BASENAME]: {
                    target: `http://127.0.0.1:${httpServer.port}`,
                    pathRewrite: {
                      [`^${ROUTE_BASENAME}`]: '',
                    },
                    ws: true,
                    onProxyReq(proxyReq, req) {
                      const addrInfo = req.socket.address();
                      if ('address' in addrInfo) {
                        const { address } = addrInfo;
                        proxyReq.setHeader('X-Forwarded-For', address);
                      } else {
                        proxyReq.removeHeader('X-Forwarded-For');
                      }
                    },
                  },
                } as Record<string, ProxyDetail>,
              },
            },
          };
        },
      };
    },
  };
};

export default devtoolsPlugin;

const setupHttpServer = async () => {
  const app = new Hono<{ Bindings: HttpBindings }>();
  const port = await getPort(8782, { slient: true });
  const clientServeDir = path.resolve(
    require.resolve('@modern-js/devtools-client/package.json'),
    '../dist',
  );

  const handleCookieApi = async (c: Context) => {
    const raw = c.req.header('Cookie');
    const { parse } = await import('cookie-es');
    const cookies = raw ? parse(raw) : {};
    const body: Record<string, any> | null = await c.req
      .json()
      .catch(() => null);
    if (body?.setCookies) {
      const { setCookies } = body;
      assert(typeof setCookies === 'object', 'setCookies should be object');
      for (const [k, v] of Object.entries(setCookies)) {
        assert(typeof v === 'string');
        // Expires for 30 days.
        const expires = new Date(
          Date.now() + 30 * 24 * 3_600_000,
        ).toUTCString();
        cookies[k] = v;
        c.header('Set-Cookie', `${k}=${v}; Expires=${expires}`, {
          append: true,
        });
      }
    }
    return c.json({ cookies });
  };
  app.get('/api/cookies', handleCookieApi);
  app.post('/api/cookies', handleCookieApi);

  app.use(
    '/static/*',
    // Workaround for https://github.com/honojs/node-server/blob/dd0e0cd160b0b8f18abbcb28c5f5c39b72105d98/src/serve-static.ts#L56
    serveStatic({ root: path.relative(process.cwd(), clientServeDir) }),
  );

  app.get(':filename{.+\\.hot-update\\.\\w+$}', async c => {
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
  });

  app.get('*', async c => {
    const filename = path.resolve(clientServeDir, 'html/client/index.html');
    const content = await fs.readFile(filename, 'utf-8');
    return c.html(content);
  });

  const instance = serve({
    fetch: app.fetch,
    port,
    hostname: '127.0.0.1', // https://stackoverflow.com/questions/77142563/nodejs-18-breaks-dns-resolution-of-localhost-from-127-0-0-1-to-1
    serverOptions: {
      allowHTTP1: true,
    },
  });
  assert(instance instanceof http.Server, 'instance should be http.Server');

  return { instance, port };
};
