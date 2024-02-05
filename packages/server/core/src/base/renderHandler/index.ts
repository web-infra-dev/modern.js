import path from 'path';
import { existsSync } from 'fs';
import { SERVER_DIR } from '@modern-js/utils';
import { Metrics } from '@modern-js/types';
import { Middleware, ServerBaseOptions, HonoNodeEnv } from '../types';
import { ServerBase } from '../serverBase';
import { CustomServer } from '../middlewares';
import { warmup } from '../libs/warmup';
import { checkIsProd, getRuntimeEnv } from '../libs/utils';
import { ssrCache } from './ssrCache';
import { Render, createRender } from './render';

function createRenderHandler(render: Render): Middleware<HonoNodeEnv> {
  return async (c, _) => {
    const logger = c.get('logger');
    const request = c.req.raw;
    const nodeReq = c.env.node?.req;

    const res = await render(request, { logger, nodeReq });
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

    const render = createRender({
      routes,
      pwd,
      staticGenerate: options.staticGenerate,
      metaName: options.metaName || 'modern-js',
      forceCSR,
      nonce: options.config.security?.nonce,
    });

    server.get('*', createRenderHandler(render));
  }
}
