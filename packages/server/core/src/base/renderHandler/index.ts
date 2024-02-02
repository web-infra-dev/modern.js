import path from 'path';
import { existsSync } from 'fs';
import { SERVER_DIR } from '@modern-js/utils';
import { ServerRoute, Metrics } from '@modern-js/types';
import { Middleware, ServerBaseOptions, HonoNodeEnv } from '../types';
import { ServerBase } from '../serverBase';
import { CustomServer } from '../middlewares';
import { warmup } from '../libs/warmup';
import { checkIsProd, getRuntimeEnv } from '../libs/utils';
import { ssrCache } from './ssrCache';
import { createRender } from './render';

export interface CreateRenderHOptions {
  routes: ServerRoute[];
  pwd: string;
  metaName: string;
  // for use-loader api when ssg
  staticGenerate?: boolean;
  forceCSR?: boolean;
}

async function createRenderHandler(
  options: CreateRenderHOptions,
): Promise<Middleware<HonoNodeEnv>> {
  const { forceCSR, metaName, routes, pwd, staticGenerate = false } = options;

  const render = createRender({
    routes,
    pwd,
    staticGenerate,
    metaName,
    forceCSR,
  });

  return async (c, _) => {
    const logger = c.get('logger');
    const response = c.req.raw;
    response.$logger = logger;

    const res = await render(c.req.raw);
    return res;
  };
}

export type BindRenderHandleOptions = {
  metaName?: string;
  metrics?: Metrics;
  staticGenerate?: boolean;
};

export async function bindRenderHandler(
  server: ServerBase,
  options: ServerBaseOptions & BindRenderHandleOptions,
) {
  const { config, routes, pwd, metrics } = options;

  const { runner } = server;
  if (routes && routes.length > 0) {
    // TODO: get server config from server.ssr & server.ssrByEntries
    const ssrConfig = config.server?.ssr;
    const forceCSR = typeof ssrConfig === 'object' ? ssrConfig.forceCSR : false;
    const customServer = new CustomServer(runner, server, pwd, metrics);

    // warn ssr bundles
    const ssrBundles = routes
      .filter(route => route.isSSR && route.bundle)
      .map(route => path.join(pwd, route.bundle!));
    warmup(ssrBundles);

    // load ssr cache mod
    ssrCache.loadCacheMod(checkIsProd() ? pwd : undefined);

    const pageRoutes = routes
      .filter(route => !route.isApi)
      // ensure route.urlPath.length diminishing
      .sort((a, b) => b.urlPath.length - a.urlPath.length);

    for (const route of pageRoutes) {
      const { urlPath: originUrlPath, entryName } = route;
      const urlPath = originUrlPath.endsWith('/')
        ? `${originUrlPath}*`
        : `${originUrlPath}/*`;

      const customServerHookMiddleware = customServer.getHookMiddleware(
        entryName || 'main',
        routes,
      );

      server.use(urlPath, customServerHookMiddleware);

      const serverDir = path.join(
        options.appContext.appDirectory || pwd,
        SERVER_DIR,
      );

      // TODO: onlyApi
      if (getRuntimeEnv() === 'node' && existsSync(serverDir)) {
        const customServerMiddleware = customServer.getServerMiddleware();
        server.use(urlPath, customServerMiddleware);
      }
    }

    const renderHandler = await createRenderHandler({
      pwd,
      routes: pageRoutes,
      staticGenerate: options.staticGenerate,
      forceCSR,
      metaName: options.metaName || 'modern-js',
    });

    server.get('*', renderHandler);
  }
}
