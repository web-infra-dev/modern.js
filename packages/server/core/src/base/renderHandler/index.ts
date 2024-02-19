import path from 'path';
import { existsSync } from 'fs';
import { SERVER_DIR } from '@modern-js/utils';
import { Metrics } from '@modern-js/types';
import { Render } from '@core/render';
import { Middleware, ServerBaseOptions } from '../../core/server';
import { ServerBase } from '../serverBase';
import { CustomServer } from '../middlewares';
import { checkIsProd, getRuntimeEnv, warmup } from '../libs/utils';
import { HonoNodeEnv } from '../adapters/node';
import { initReporter } from '../middlewares/monitor';
import { ssrCache } from './ssrCache';
import { createRender } from './render';

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

export function getRenderHandler(
  options: ServerBaseOptions & BindRenderHandleOptions,
) {
  const { routes, pwd, config } = options;
  if (routes && routes.length > 0) {
    const ssrConfig = config.server?.ssr;
    const forceCSR = typeof ssrConfig === 'object' ? ssrConfig.forceCSR : false;
    const render = createRender({
      routes,
      pwd,
      staticGenerate: options.staticGenerate,
      metaName: options.metaName || 'modern-js',
      forceCSR,
      nonce: options.config.security?.nonce,
    });
    return render;
  }
  return null;
}

export async function bindRenderHandler(
  server: ServerBase,
  options: ServerBaseOptions & BindRenderHandleOptions,
) {
  const { routes, pwd, metrics } = options;

  const { runner } = server;
  if (routes && routes.length > 0) {
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

      // init reporter.client when every request call
      server.use(urlPath, initReporter(entryName!));

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

    const render = getRenderHandler(options);

    render && server.get('*', createRenderHandler(render));
  }
}
