import { Render } from '../../../core/render';
import { Middleware, ServerBaseOptions } from '../../../core/server';
import { ServerBase } from '../../serverBase';
import { warmup, checkIsProd, sortRoutes, getPathModule } from '../../utils';
import { HonoNodeEnv } from '../../adapters/node';
import { initReporter } from '../monitor';
import { CustomServer } from '../customServer';
import { ssrCache } from './ssrCache';
import { createRender } from './render';

function createRenderHandler(render: Render): Middleware<HonoNodeEnv> {
  return async (c, _) => {
    const logger = c.get('logger');
    const reporter = c.get('reporter');
    const request = c.req.raw;
    const nodeReq = c.env.node?.req;

    const res = await render(request, { logger, nodeReq, reporter });
    return res;
  };
}

export type BindRenderHandleOptions = {
  templates: Record<string, string>;
  metaName?: string;
  staticGenerate?: boolean;
};

export function getRenderHandler(
  options: ServerBaseOptions & BindRenderHandleOptions,
) {
  const { routes, pwd, config, templates } = options;
  if (routes && routes.length > 0) {
    const ssrConfig = config.server?.ssr;
    const forceCSR = typeof ssrConfig === 'object' ? ssrConfig.forceCSR : false;
    const render = createRender({
      routes,
      pwd,
      staticGenerate: options.staticGenerate,
      templates,
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
  const { routes, pwd } = options;
  const path = await getPathModule();

  const { runner } = server;
  if (routes && routes.length > 0) {
    const customServer = new CustomServer(runner, server, pwd);

    // warn ssr bundles
    const ssrBundles = routes
      .filter(route => route.isSSR && route.bundle)
      .map(route => path.join(pwd, route.bundle!));
    warmup(ssrBundles);

    // load ssr cache mod
    await ssrCache.loadCacheMod(checkIsProd() ? pwd : undefined);

    const pageRoutes = routes
      .filter(route => !route.isApi)
      // ensure route.urlPath.length diminishing
      .sort(sortRoutes);

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

      const customServerMiddleware = customServer.getServerMiddleware();
      server.use(urlPath, customServerMiddleware);
    }

    const render = getRenderHandler(options);

    render && server.get('*', createRenderHandler(render));
  }
}
