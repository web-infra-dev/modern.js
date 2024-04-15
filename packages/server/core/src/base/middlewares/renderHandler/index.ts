import { Render } from '../../../core/render';
import { Middleware, ServerEnv } from '../../../core/server';
import { ServerBase, type ServerBaseOptions } from '../../serverBase';
import { checkIsProd, sortRoutes, getRuntimeEnv } from '../../utils';
import type { ServerNodeEnv } from '../../adapters/node/hono';
import { initReporter } from '../monitor';
import { CustomServer } from '../customServer';
import { createRender } from './render';
import type * as ssrCacheModule from './ssrCache';

function createRenderHandler(
  render: Render,
): Middleware<ServerNodeEnv & ServerEnv> {
  return async (c, _) => {
    const logger = c.get('logger');
    const reporter = c.get('reporter');
    const templates = c.get('templates') || {};
    const serverManifest = c.get('serverManifest') || {};
    const locals = c.get('locals');
    const metrics = c.get('metrics');

    const request = c.req.raw;
    const nodeReq = c.env.node?.req;

    const res = await render(request, {
      logger,
      nodeReq,
      reporter,
      templates,
      metrics,
      serverManifest,
      locals,
    });

    return res;
  };
}

export type BindRenderHandleOptions = {
  metaName?: string;
  staticGenerate?: boolean;
  disableCustomHook?: boolean;
};

export async function getRenderHandler(
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
  const { routes, pwd, disableCustomHook } = options;

  const { runner } = server;
  if (routes && routes.length > 0) {
    const customServer = new CustomServer(runner, server, pwd);

    // FIXME: support warn ssr bundles in node bundles
    // const ssrBundles = routes
    //   .filter(route => route.isSSR && route.bundle)
    //   .map(route => path.join(pwd, route.bundle!));
    // warmup(ssrBundles);

    // load ssr cache mod
    if (getRuntimeEnv() === 'node') {
      const cacheModuleName = './ssrCache';
      const { ssrCache } = (await import(
        cacheModuleName
      )) as typeof ssrCacheModule;
      await ssrCache.loadCacheMod(checkIsProd() ? pwd : undefined);
    }

    const pageRoutes = routes
      .filter(route => !route.isApi)
      // ensure route.urlPath.length diminishing
      .sort(sortRoutes);

    const render = await getRenderHandler(options);
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

      !disableCustomHook && server.use(urlPath, customServerHookMiddleware);

      const customServerMiddleware = customServer.getServerMiddleware();
      server.use(urlPath, customServerMiddleware);

      render && server.all(urlPath, createRenderHandler(render));
    }
  }
}
