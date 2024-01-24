import { Server as NodeServer } from 'node:http';
import path from 'node:path';
import {
  createServerBase,
  connectMid2HonoMid,
  registerMockHandler,
  ServerBaseOptions,
  Middleware,
} from '@modern-js/server-core/base';

import { DevMiddlewaresConfig } from '@rsbuild/shared';
import { ServerRoute } from '@modern-js/types';
import { SSR, ServerHookRunner } from '@modern-js/server-core';
import { LOADABLE_STATS_FILE } from '@modern-js/utils';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import {
  CreateProdServer,
  DevServerOptions,
  ModernDevServerConfig as ModernDevServerOptionsNew,
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

const getBundles = (routes: ServerRoute[]) => {
  return routes.filter(route => route.isSSR).map(route => route.bundle);
};

const cleanSSRCache = (distDir: string, routes: ServerRoute[]) => {
  const bundles = getBundles(routes);

  bundles.forEach(bundle => {
    const filepath = path.join(distDir, bundle as string);
    if (require.cache[filepath]) {
      delete require.cache[filepath];
    }
  });

  const loadable = path.join(distDir, LOADABLE_STATS_FILE);
  if (require.cache[loadable]) {
    delete require.cache[loadable];
  }
};

const initFileReader = (): Middleware => {
  let isInit = false;

  return async (ctx, next) => {
    if (isInit) {
      return next();
    }
    isInit = true;

    const { res } = ctx.env.node;
    if (!res.locals?.webpack) {
      fileReader.reset();
      return next();
    }

    // When devServer.devMiddleware.writeToDisk is configured as false,
    // the renderHandler needs to read the html file in memory through the fileReader
    const { devMiddleware: webpackDevMid } = res.locals.webpack;
    const { outputFileSystem } = webpackDevMid;
    if (outputFileSystem) {
      fileReader.reset(outputFileSystem);
    } else {
      fileReader.reset();
    }
    return next();
  };
};

const onRepack = (
  distDir: string,
  runner: ServerHookRunner,
  routes: ServerRoute[],
) => {
  cleanSSRCache(distDir, routes);
  fileReader.reset();
  runner.repack();
};

export const createDevServer = async <O extends ServerBaseOptions>(
  options: ModernDevServerOptionsNew<O>,
  createProdServer: CreateProdServer<O>,
): Promise<NodeServer> => {
  const { config, pwd, routes, getMiddlewares, dev, rsbuild } = options;

  const server = await createServerBase(options);
  const closeCb: Array<(...args: []) => any> = [];
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
      server.use('*', connectMid2HonoMid(middleware));
    });
  }

  server.use('*', initFileReader());

  const nodeServer = await createProdServer(options, server);

  rsbuild?.onDevCompileDone(({ stats }) => {
    // Reset only when client compile done
    if (stats.toJson({ all: false }).name !== 'server') {
      onRepack(
        path.resolve(options.pwd, options.config.output.path || 'dist'),
        server.runner,
        routes || [],
      );
    }
  });

  onUpgrade && nodeServer.on('upgrade', onUpgrade);

  closeCb.length > 0 &&
    nodeServer.on('close', () => {
      closeCb.forEach(cb => {
        cb();
      });
    });

  return nodeServer;
};
