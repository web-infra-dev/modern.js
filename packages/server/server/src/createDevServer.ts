import { Server as NodeServer } from 'node:http';
import {
  createServerBase,
  httpCallBack2HonoMid,
  registerMockHandler,
} from '@modern-js/server-core/base';

import { DevMiddlewaresConfig } from '@rsbuild/shared';
import { ServerRoute } from '@modern-js/types';
import { SSR } from '@modern-js/server-core';
import {
  CreateNodeServer,
  DevServerOptions,
  ModernDevServerOptionsNew,
} from './types';
import { enableRegister } from './dev-tools/register';

const transformToRsbuildServerOptions = (
  dev: DevServerOptions,
): DevMiddlewaresConfig => {
  const rsbuildOptions: DevMiddlewaresConfig = {
    hmr: Boolean(dev.hot),
    client: dev.client,
    writeToDisk: dev.devMiddleware?.writeToDisk,
    compress: dev.compress,
    headers: dev.headers,
    historyApiFallback: dev.historyApiFallback,
    proxy: dev.proxy,
    publicDir: false,
  };
  if (dev.before?.length || dev.after?.length) {
    rsbuildOptions.setupMiddlewares = [
      ...(dev.setupMiddlewares || []),
      middlewares => {
        // the order: devServer.before => setupMiddlewares.unshift => internal middlewares => setupMiddlewares.push => devServer.after.
        middlewares.unshift(...(dev.before || []));

        middlewares.push(...(dev.after || []));
      },
    ];
  } else if (dev.setupMiddlewares) {
    rsbuildOptions.setupMiddlewares = dev.setupMiddlewares;
  }

  return rsbuildOptions;
};

const isUseStreamingSSR = (routes?: ServerRoute[]) =>
  routes?.some(r => r.isStream === true);

const isUseSSRPreload = (conf: ModernDevServerOptionsNew['config']) => {
  const {
    server: { ssr, ssrByEntries },
  } = conf;

  const checkUsePreload = (ssr?: SSR) =>
    typeof ssr === 'object' && Boolean(ssr.preload);

  return (
    checkUsePreload(ssr) ||
    Object.values(ssrByEntries || {}).some(ssr => checkUsePreload(ssr))
  );
};

export const createDevServer = async (
  options: ModernDevServerOptionsNew,
  createNodeServer: CreateNodeServer,
): Promise<NodeServer> => {
  const { config, pwd, routes, getMiddlewares, dev, rsbuild } = options;

  const server = await createServerBase(options);
  const closeCb = [];
  enableRegister(pwd, config);
  registerMockHandler({
    pwd,
    server,
  });

  let rsbuildMiddlewares;
  let close;
  let onUpgrade;

  if (getMiddlewares) {
    // https://github.com/web-infra-dev/rsbuild/blob/32fbb85e22158d5c4655505ce75e3452ce22dbb1/packages/shared/src/types/server.ts#L112
    ({
      middlewares: rsbuildMiddlewares,
      close,
      onUpgrade,
    } = await getMiddlewares({
      ...transformToRsbuildServerOptions(dev),
      compress:
        !isUseStreamingSSR(routes) &&
        !isUseSSRPreload(options.config) &&
        dev.compress,
      htmlFallback: false,
      publicDir: false,
    }));

    closeCb.push(close);

    rsbuildMiddlewares.forEach(middleware => {
      // TODO: modify httpCallBack2HonoMid
      // @ts-expect-error-error
      server.use(httpCallBack2HonoMid(middleware));
    });
  }

  const nodeServer = await createNodeServer(options, server);

  rsbuild?.onDevCompileDone(({ stats }) => {
    // Reset only when client compile done
    if (stats.toJson({ all: false }).name !== 'server') {
      // TODO: add repack
      // onRepack({ routes });
    }
  });

  onUpgrade && nodeServer.on('upgrade', onUpgrade);

  return nodeServer;
};
