import { Server as NodeServer } from 'node:http';
import path from 'node:path';
import {
  createServerBase,
  connectMid2HonoMid,
  ServerBaseOptions,
  registerMockHandlers,
  Middleware,
  ServerBase,
} from '@modern-js/server-core/base';

import { DevMiddlewaresConfig } from '@rsbuild/shared';
import { ServerRoute } from '@modern-js/types';
import { SSR, ServerHookRunner } from '@modern-js/server-core';
import {
  API_DIR,
  LOADABLE_STATS_FILE,
  SERVER_BUNDLE_DIRECTORY,
  SERVER_DIR,
  SHARED_DIR,
  WatchOptions,
  logger,
} from '@modern-js/utils';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { AGGRED_DIR } from '@modern-js/prod-server';
import { merge } from '@modern-js/utils/lodash';
import {
  CreateProdServer,
  DevServerOptions,
  ModernDevServerConfig as ModernDevServerOptionsNew,
} from './types';
import { enableRegister } from './dev-tools/register';
import Watcher, { WatchEvent, mergeWatchOptions } from './dev-tools/watcher';
import { getDefaultDevOptions } from './constants';

async function onServerChange({
  pwd,
  filepath,
  event,
  server,
}: {
  pwd: string;
  filepath: string;
  event: WatchEvent;
  server: ServerBase;
}) {
  const { mock } = AGGRED_DIR;
  const mockPath = path.normalize(path.join(pwd, mock));

  const { runner } = server;
  runner.reset();
  if (filepath.startsWith(mockPath)) {
    await registerMockHandlers({
      pwd,
      server,
    });
    logger.info('Finish registering the mock handlers');
  } else {
    try {
      await runner.onApiChange([{ filename: filepath, event }]);
      logger.info('Finish reload server');
    } catch (e) {
      logger.error(e as Error);
    }
  }
}

function startWatcher({
  pwd,
  distDir,
  apiDir,
  sharedDir,
  watchOptions,
  server,
}: {
  pwd: string;
  distDir: string;
  apiDir: string;
  sharedDir: string;
  watchOptions?: WatchOptions;
  server: ServerBase;
}) {
  const { mock } = AGGRED_DIR;
  const defaultWatched = [
    `${mock}/**/*`,
    `${SERVER_DIR}/**/*`,
    `${apiDir}/**`,
    `${sharedDir}/**/*`,
    `${distDir}/${SERVER_BUNDLE_DIRECTORY}/*-server-loaders.js`,
  ];

  const mergedWatchOptions = mergeWatchOptions(watchOptions);

  const defaultWatchedPaths = defaultWatched.map(p => {
    const finalPath = path.isAbsolute(p) ? p : path.join(pwd, p);
    return path.normalize(finalPath);
  });

  const watcher = new Watcher();
  watcher.createDepTree();
  watcher.listen(defaultWatchedPaths, mergedWatchOptions, (filepath, event) => {
    // TODO: should delete this cache in onRepack
    if (filepath.includes('-server-loaders.js')) {
      delete require.cache[filepath];
    } else {
      watcher.updateDepTree();
      watcher.cleanDepCache(filepath);
    }

    onServerChange({
      pwd,
      filepath,
      event,
      server,
    });
  });

  return watcher;
}

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

const getDevOptions = (options: ModernDevServerOptionsNew) => {
  const devOptions = options.dev;
  const defaultOptions = getDefaultDevOptions();
  return merge(defaultOptions, devOptions);
};

export const createDevServer = async <O extends ServerBaseOptions>(
  options: ModernDevServerOptionsNew<O>,
  createProdServer: CreateProdServer<O>,
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

  const server = await createServerBase(options);
  const closeCb: Array<(...args: []) => any> = [];
  enableRegister(pwd, config);
  registerMockHandlers({
    pwd,
    server,
  });

  let rsbuildMiddlewares;
  let close;
  let onUpgrade;
  let watcher;

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
      if (Array.isArray(middleware)) {
        server.all(middleware[0], connectMid2HonoMid(middleware[1]));
      } else {
        server.all('*', connectMid2HonoMid(middleware));
      }
    });
  }

  server.use('*', initFileReader());

  const nodeServer = await createProdServer(options, server);

  rsbuild?.onDevCompileDone(({ stats }) => {
    // Reset only when client compile done
    if (stats.toJson({ all: false }).name !== 'server') {
      onRepack(distDir, server.runner, routes);
    }
  });

  onUpgrade && nodeServer.on('upgrade', onUpgrade);

  if (dev.watch) {
    const { watchOptions } = config.server;
    watcher = startWatcher({
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
