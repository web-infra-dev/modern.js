import http from 'http';
import path from 'path';
import { ProxyDetail } from '@modern-js/types';
import { getPort, logger } from '@modern-js/utils';
import createServeMiddleware from 'serve-static';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { ROUTE_BASENAME } from '@modern-js/devtools-kit';
import { withQuery } from 'ufo';
import {
  DevtoolsPluginOptions,
  DevtoolsPluginInlineOptions,
  resolveContext,
} from './config';
import { setupClientConnection } from './rpc';
import { SocketServer } from './utils/socket';

export type { DevtoolsPluginOptions, DevtoolsPluginInlineOptions };

export const devtoolsPlugin = (
  inlineOptions: DevtoolsPluginInlineOptions = {},
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-devtools',
  usePlugins: [],
  setup: async api => {
    const ctx = resolveContext(inlineOptions);
    if (!ctx.enable) {
      return {};
    }

    const httpServer = await setupHttpServer();
    const socketServer = new SocketServer({
      server: httpServer.instance,
      path: '/rpc',
    });
    const rpc = await setupClientConnection({ api, server: socketServer });

    return {
      prepare: rpc.hooks.prepare,
      modifyFileSystemRoutes: rpc.hooks.modifyFileSystemRoutes,
      beforeRestart() {
        return new Promise((resolve, reject) =>
          httpServer.instance.close(err => (err ? reject(err) : resolve())),
        );
      },
      config() {
        const config = api.useConfigContext().devtools ?? {};
        Object.assign(ctx, resolveContext(ctx, config), {
          __keep: true, // Keep resource query always existing.
        });
        logger.info(`${ctx.def.name.formalName} Devtools is enabled`);

        const runtimeEntry = require.resolve(
          '@modern-js/devtools-client/mount',
        );

        return {
          builderPlugins: [rpc.builderPlugin],
          source: {
            preEntry: [withQuery(runtimeEntry, ctx)],
          },
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
});

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
