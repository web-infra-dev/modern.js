import http from 'http';
import path from 'path';
import assert from 'assert';
import _ from '@modern-js/utils/lodash';
import { ProxyDetail } from '@modern-js/types';
import { getPort, logger } from '@modern-js/utils';
import createServeMiddleware from 'serve-static';
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
          const storagePresets = await loadConfigFiles(appCtx.appDirectory);
          ctx.storagePresets.push(...storagePresets);
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
                    target: `http://localhost:${httpServer.port}`,
                    pathRewrite: {
                      [`^${ROUTE_BASENAME}`]: '',
                    },
                    ws: true,
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
  const port = await getPort(8782, { slient: true });
  const clientServeDir = path.resolve(
    require.resolve('@modern-js/devtools-client/package.json'),
    '../dist',
  );
  const serveMiddleware = createServeMiddleware(clientServeDir);
  const instance = http.createServer((req, res) => {
    const usePageNotFound = () => {
      res.write('404');
      res.statusCode = 404;
      res.end();
    };
    const useMainRoute = () => {
      req.url = '/html/client/index.html';
      serveMiddleware(req, res, usePageNotFound);
    };
    serveMiddleware(req, res, useMainRoute);
  });
  instance.listen(port);
  return {
    instance,
    port,
  };
};
