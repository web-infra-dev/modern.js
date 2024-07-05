import { ServerPlugin, ServerBaseOptions } from '@modern-js/server-core';
import { connectMid2HonoMid } from '@modern-js/server-core/node';
import { API_DIR, SHARED_DIR } from '@modern-js/utils';
import { ModernDevServerOptions } from './types';
import {
  startWatcher,
  onRepack,
  getDevOptions,
  initFileReader,
  registerMockHandlers,
} from './helpers';

export const devPlugin = <O extends ServerBaseOptions>(
  options: ModernDevServerOptions<O>,
): ServerPlugin => ({
  name: '@modern-js/plugin-dev',

  setup(api) {
    const { getMiddlewares, rsbuild, config, pwd } = options;

    const closeCb: Array<(...args: []) => any> = [];

    // https://github.com/web-infra-dev/rsbuild/blob/32fbb85e22158d5c4655505ce75e3452ce22dbb1/packages/shared/src/types/server.ts#L112
    const {
      middlewares: rsbuildMiddlewares,
      close,
      onHTTPUpgrade,
    } = getMiddlewares?.() || {};

    close && closeCb.push(close);

    const dev = getDevOptions(options);

    return {
      async prepare() {
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

        rsbuild?.onDevCompileDone(({ stats }) => {
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

        if (rsbuildMiddlewares) {
          middlewares.push({
            name: 'rsbuild-dev',
            handler: connectMid2HonoMid(rsbuildMiddlewares),
          });
        }

        await registerMockHandlers({
          pwd,
          server: serverBase!,
        });

        middlewares.push({
          name: 'init-file-reader',
          handler: initFileReader(),
        });
      },
    };
  },
});
