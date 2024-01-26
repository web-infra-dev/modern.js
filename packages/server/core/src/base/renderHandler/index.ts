import path from 'path';
import { existsSync } from 'fs';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { SERVER_DIR, cutNameByHyphen } from '@modern-js/utils';
import { ServerRoute, Logger, Metrics } from '@modern-js/types';
import { HonoRequest, Middleware, ServerBaseOptions } from '../types';
import { ServerBase } from '../serverBase';
import { CustomServer } from '../middlewares';
import { warmup } from '../libs/warmup';
import { getRuntimeEnv } from '../libs/utils';
import { createSSRHandler } from './ssrHandler';
import { ssrCache } from './ssrCache';

export interface CreateRenderHOptions {
  routeInfo: ServerRoute;
  pwd: string;
  metaName: string;
  logger: Logger;

  // for use-loader api when ssg
  staticGenerate?: boolean;
  forceCSR?: boolean;
}

async function createRenderHandler(
  options: CreateRenderHOptions,
): Promise<Middleware> {
  const {
    forceCSR,
    metaName,
    routeInfo,
    pwd,
    logger,
    staticGenerate = false,
  } = options;

  return async (c, _) => {
    const htmlPath = path.join(pwd, routeInfo.entryPath);
    const html = (await fileReader.readFile(htmlPath))?.toString();

    if (!html) {
      throw new Error(`Can't found html in the path: ${htmlPath}`);
    }

    const renderMode = getRenderMode(
      c.req,
      metaName,
      routeInfo.isSSR,
      forceCSR,
    );

    const handler =
      renderMode === 'csr'
        ? createCSRHandler(html)
        : await createSSRHandler({
            pwd,
            html,
            staticGenerate,
            mode: routeInfo.isStream ? 'stream' : 'string',
            routeInfo,
            metaName,
            logger,
          });

    return handler(c, _);
  };
}

function createCSRHandler(html: string): Middleware {
  return async c => {
    return c.html(html);
  };
}

function getRenderMode(
  req: HonoRequest,
  framework: string,
  isSSR?: boolean,
  forceCSR?: boolean,
): 'ssr' | 'csr' {
  if (isSSR) {
    if (
      forceCSR &&
      (req.query('csr') ||
        req.header(`x-${cutNameByHyphen(framework)}-ssr-fallback`))
    ) {
      return 'csr';
    }
    return 'ssr';
  } else {
    return 'csr';
  }
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
    const customServer = new CustomServer(
      runner,
      server,
      pwd,
      server.logger,
      metrics,
    );

    // warn ssr bundles
    const ssrBundles = routes
      .filter(route => route.isSSR && route.bundle)
      .map(route => path.join(pwd, route.bundle!));
    warmup(ssrBundles);

    // load ssr cache mod
    ssrCache.loadCacheMod(pwd);

    const pageRoutes = routes
      .filter(route => !route.isApi)
      // ensure route.urlPath.length diminishing
      .sort((a, b) => b.urlPath.length - a.urlPath.length);

    for (const route of pageRoutes) {
      const { urlPath: originUrlPath, entryName } = route;
      const urlPath = originUrlPath.endsWith('/')
        ? `${originUrlPath}*`
        : `${originUrlPath}/*`;

      const handler = await createRenderHandler({
        pwd,
        routeInfo: route,
        staticGenerate: options.staticGenerate,
        forceCSR,
        metaName: options.metaName || 'modern-js',
        logger: server.logger,
      });

      const customServerHookMiddleware = customServer.getHookMiddleware(
        entryName || 'main',
        routes,
      );

      server.use(urlPath, customServerHookMiddleware);

      const serverDir = path.join(pwd, SERVER_DIR);

      // TODO: onlyApi
      if (getRuntimeEnv() === 'node' && existsSync(serverDir)) {
        const customServerMiddleware = customServer.getServerMiddleware();
        server.use(urlPath, customServerMiddleware);
      }
      server.get(urlPath, handler);
    }
  }
}
