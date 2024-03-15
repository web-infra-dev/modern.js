import { Server as NodeServer } from 'node:http';
import path from 'node:path';
import {
  ServerBaseOptions,
  createServerBase,
} from '@modern-js/server-core/base';
import {
  registerMockHandlers,
  createNodeServer,
  connectMid2HonoMid,
} from '@modern-js/server-core/base/node';
import { API_DIR, SHARED_DIR } from '@modern-js/utils';
import { InitProdMiddlewares, ModernDevServerOptions } from './types';
import { enableRegister } from './dev-tools/register';
import {
  startWatcher,
  onRepack,
  getDevOptions,
  transformToRsbuildServerOptions,
  initFileReader,
} from './helpers';
import { isUseStreamingSSR, isUseSSRPreload } from './helpers/utils';

export type { ModernDevServerOptions, InitProdMiddlewares } from './types';

export const createDevServer = async <O extends ServerBaseOptions>(
  options: ModernDevServerOptions<O>,
  initProdMiddlewares: InitProdMiddlewares<O>,
): Promise<NodeServer> => {
  const {
    config,
    pwd,
    routes = [],
    getMiddlewares,
    rsbuild,
    appContext,
  } = options;
  const dev = getDevOptions(options);

  const distDir = path.resolve(pwd, config.output.path || 'dist');
  const apiDir = appContext?.apiDirectory || API_DIR;
  const sharedDir = appContext?.sharedDirectory || SHARED_DIR;

  const prodServerOptions = {
    ...options,
    pwd: distDir, // server base pwd must distDir,
  };

  const server = createServerBase(prodServerOptions);

  const closeCb: Array<(...args: []) => any> = [];
  enableRegister(pwd, config);
  registerMockHandlers({
    pwd,
    server,
  });

  // https://github.com/web-infra-dev/rsbuild/blob/32fbb85e22158d5c4655505ce75e3452ce22dbb1/packages/shared/src/types/server.ts#L112
  const {
    middlewares: rsbuildMiddlewares,
    close,
    onUpgrade,
  } = (await getMiddlewares?.({
    ...transformToRsbuildServerOptions(dev),
    compress:
      !isUseStreamingSSR(routes) &&
      !isUseSSRPreload(options.config) &&
      dev.compress,
    htmlFallback: false,
    publicDir: false,
  })) || {};

  close && closeCb.push(close);
  rsbuildMiddlewares?.forEach(middleware => {
    if (Array.isArray(middleware)) {
      server.all(middleware[0], connectMid2HonoMid(middleware[1]));
    } else {
      server.all('*', connectMid2HonoMid(middleware));
    }
  });

  server.use('*', initFileReader());
  await server.init();
  const nodeServer = createNodeServer(server.handle.bind(server));

  rsbuild?.onDevCompileDone(({ stats }) => {
    if (stats.toJson({ all: false }).name !== 'server') {
      onRepack(distDir, server.runner, routes);
    }
  });

  onUpgrade && nodeServer.on('upgrade', onUpgrade);

  await server.runner.beforeServerInit({
    app: nodeServer,
  });

  await initProdMiddlewares(server, prodServerOptions);

  if (dev.watch) {
    const { watchOptions } = config.server;
    const watcher = startWatcher({
      pwd,
      distDir,
      apiDir,
      sharedDir,
      watchOptions,
      server,
    });
    closeCb.push(watcher.close.bind(watcher));
  }

  closeCb.length > 0 &&
    nodeServer.on('close', () => {
      closeCb.forEach(cb => {
        cb();
      });
    });

  return nodeServer;
};
