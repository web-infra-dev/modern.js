import http from 'http';
import path from 'path';
import { ProxyDetail } from '@modern-js/types';
import { getPort } from '@modern-js/utils';
import createServeMiddleware from 'serve-static';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import {
  SetupClientOptions,
  ClientDefinition,
  ROUTE_BASENAME,
} from '@modern-js/devtools-kit';
import { withQuery } from 'ufo';
import { Options, resolveOptions } from './config';
import { setupClientConnection } from './rpc';
import { SocketServer } from './utils/socket';

export type { Options };

export const devtoolsPlugin = (options?: Options): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-devtools',
  usePlugins: [],
  setup: async api => {
    const port = await getPort(8782, { slient: true });
    const clientServeDir = path.resolve(
      require.resolve('@modern-js/devtools-client/package.json'),
      '../dist',
    );
    const serveMiddleware = createServeMiddleware(clientServeDir);
    const httpServer = http.createServer((req, res) => {
      const usePageNotFound = () => {
        res.write('404');
        res.statusCode = 404;
        res.end();
      };
      const useMainRoute = () => {
        req.url = '/html/main/index.html';
        serveMiddleware(req, res, usePageNotFound);
      };
      serveMiddleware(req, res, useMainRoute);
    });
    httpServer.listen(port);

    const socketServer = new SocketServer({ server: httpServer, path: '/rpc' });
    const rpc = await setupClientConnection({ api, server: socketServer });

    return {
      prepare: rpc.hooks.prepare,
      modifyFileSystemRoutes: rpc.hooks.modifyFileSystemRoutes,
      validateSchema() {
        return [
          {
            target: 'devtools',
            schema: { typeof: ['boolean', 'object'] },
          },
        ];
      },
      beforeRestart() {
        return new Promise((resolve, reject) =>
          httpServer.close(err => (err ? reject(err) : resolve())),
        );
      },
      config() {
        const opts = resolveOptions(api, options);
        opts.def && rpc.setDefinition(opts.def);

        const mountOpts = {
          dataSource: `${ROUTE_BASENAME}/rpc`,
          endpoint: `${ROUTE_BASENAME}/devtools`,
          __keep: true,
        } as SetupClientOptions;
        let runtimeEntry = require.resolve(
          '@modern-js/plugin-devtools/runtime',
        );
        runtimeEntry = withQuery(runtimeEntry, mountOpts);

        return {
          builderPlugins: [rpc.builderPlugin],
          source: {
            preEntry: [runtimeEntry],
            globalVars: {
              'process.env._MODERN_DEVTOOLS_LOGO_SRC': new ClientDefinition()
                .assets.logo,
            },
          },
          tools: {
            devServer: {
              proxy: {
                [ROUTE_BASENAME]: {
                  target: `http://localhost:${port}`,
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
