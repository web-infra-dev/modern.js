import type { BuilderInstance, Rspack } from '@modern-js/builder';
import type { ServerBaseOptions, ServerPlugin } from '@modern-js/server-core';
import { connectMid2HonoMid } from '@modern-js/server-core/node';
import type { RequestHandler } from '@modern-js/types';
import { API_DIR, SHARED_DIR } from '@modern-js/utils';
import {
  getDevOptions,
  getMockMiddleware,
  initFileReader,
  onRepack,
  startWatcher,
} from './helpers';
import type { ModernDevServerOptions } from './types';

type BuilderDevServer = Awaited<ReturnType<BuilderInstance['createDevServer']>>;

export type DevPluginOptions = ModernDevServerOptions<ServerBaseOptions> & {
  builderDevServer?: BuilderDevServer;
};

export const devPlugin = (
  options: DevPluginOptions,
  compiler: Rspack.Compiler | Rspack.MultiCompiler | null,
): ServerPlugin => ({
  name: '@modern-js/plugin-dev',

  setup(api) {
    const { config, pwd, builder, builderDevServer } = options;

    const closeCb: Array<(...args: []) => any> = [];

    const dev = getDevOptions(options.dev);

    api.onPrepare(async () => {
      // https://github.com/web-infra-dev/rsbuild/blob/32fbb85e22158d5c4655505ce75e3452ce22dbb1/packages/shared/src/types/server.ts#L112
      const {
        middlewares: builderMiddlewares,
        close,
        connectWebSocket,
      } = builderDevServer || {};

      close && closeCb.push(close);

      const {
        middlewares,
        distDirectory,
        nodeServer,
        apiDirectory,
        sharedDirectory,
        serverBase,
      } = api.getServerContext();

      connectWebSocket &&
        nodeServer &&
        connectWebSocket({ server: nodeServer });
      // TODO: remove any
      const hooks = (api as any).getHooks();

      // Handle webpack rebuild
      builder?.onDevCompileDone(({ stats }) => {
        if (stats.toJson({ all: false }).name !== 'server') {
          onRepack(distDirectory!, hooks);
        }
      });

      // Handle watch
      const { watchOptions } = config.server;
      const watcher = startWatcher({
        pwd,
        distDir: distDirectory!,
        apiDir: apiDirectory || API_DIR,
        sharedDir: sharedDirectory || SHARED_DIR,
        watchOptions,
        server: serverBase!,
      });
      closeCb.push(watcher.close.bind(watcher));
      closeCb.length > 0 &&
        nodeServer?.on('close', () => {
          closeCb.forEach(cb => {
            cb();
          });
        });

      // Handle setupMiddlewares
      const before: RequestHandler[] = [];
      const after: RequestHandler[] = [];
      const { setupMiddlewares = [] } = dev;
      setupMiddlewares.forEach(handler => {
        handler(
          {
            unshift: (...handlers) => before.unshift(...handlers),
            push: (...handlers) => after.push(...handlers),
          },
          {
            sockWrite: () => {
              // ignore
            },
          },
        );
      });

      before.forEach((middleware, index) => {
        middlewares.push({
          name: `before-dev-server-${index}`,
          handler: connectMid2HonoMid(middleware),
        });
      });

      const mockMiddleware = await getMockMiddleware(pwd);

      middlewares.push({
        name: 'mock-dev',
        handler: mockMiddleware,
      });

      builderMiddlewares &&
        middlewares.push({
          name: 'rsbuild-dev',
          handler: connectMid2HonoMid(builderMiddlewares as any),
        });

      after.forEach((middleware, index) => {
        middlewares.push({
          name: `after-dev-server-${index}`,
          handler: connectMid2HonoMid(middleware),
        });
      });

      middlewares.push({
        name: 'init-file-reader',
        handler: initFileReader(compiler),
      });
    });
  },
});
