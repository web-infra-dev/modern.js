import { ServerPlugin, ServerBaseOptions } from '@modern-js/server-core';
import { connectMid2HonoMid } from '@modern-js/server-core/node';
import { API_DIR, SHARED_DIR } from '@modern-js/utils';
import { RequestHandler } from '@modern-js/types';
import { ModernDevServerOptions } from './types';
import {
  startWatcher,
  onRepack,
  getDevOptions,
  initFileReader,
  getMockMiddleware,
} from './helpers';

export const devPlugin = <O extends ServerBaseOptions>(
  options: ModernDevServerOptions<O>,
): ServerPlugin => ({
  name: '@modern-js/plugin-dev',

  setup(api) {
    const { config, pwd, builder } = options;

    const closeCb: Array<(...args: []) => any> = [];

    const dev = getDevOptions(options);

    return {
      async prepare() {
        const builderDevServer = await builder?.createDevServer({
          runCompile: options.runCompile,
        });

        // https://github.com/web-infra-dev/rsbuild/blob/32fbb85e22158d5c4655505ce75e3452ce22dbb1/packages/shared/src/types/server.ts#L112
        const {
          middlewares: builderMiddlewares,
          close,
          onHTTPUpgrade,
        } = builderDevServer || {};

        close && closeCb.push(close);

        const {
          middlewares,
          distDirectory,
          nodeServer,
          apiDirectory,
          sharedDirectory,
          serverBase,
        } = api.useAppContext();

        onHTTPUpgrade && nodeServer?.on('upgrade', onHTTPUpgrade);

        const runner = api.useHookRunners();

        builder?.onDevCompileDone(({ stats }) => {
          if (stats.toJson({ all: false }).name !== 'server') {
            onRepack(distDirectory, runner);
          }
        });

        if (dev.watch) {
          const { watchOptions } = config.server;
          const watcher = startWatcher({
            pwd,
            distDir: distDirectory,
            apiDir: apiDirectory || API_DIR,
            sharedDir: sharedDirectory || SHARED_DIR,
            watchOptions,
            server: serverBase!,
          });
          closeCb.push(watcher.close.bind(watcher));
        }

        closeCb.length > 0 &&
          nodeServer?.on('close', () => {
            closeCb.forEach(cb => {
              cb();
            });
          });

        const before: RequestHandler[] = [];

        const after: RequestHandler[] = [];

        const { setupMiddlewares } = dev;

        if (dev.after?.length || dev.before?.length) {
          setupMiddlewares?.push(middlewares => {
            // the order: devServer.before => setupMiddlewares.unshift => internal middlewares => setupMiddlewares.push => devServer.after.
            middlewares.unshift(...(dev.before || []));

            middlewares.push(...(dev.after || []));
          });
        }

        setupMiddlewares?.forEach(handler => {
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
            handler: connectMid2HonoMid(builderMiddlewares),
          });

        after.forEach((middleware, index) => {
          middlewares.push({
            name: `after-dev-server-${index}`,
            handler: connectMid2HonoMid(middleware),
          });
        });

        middlewares.push({
          name: 'init-file-reader',
          handler: initFileReader(),
        });
      },
    };
  },
});
