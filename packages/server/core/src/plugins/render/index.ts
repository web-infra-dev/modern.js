import { ServerRoute } from '@modern-js/types';
import { MAIN_ENTRY_NAME } from '@modern-js/utils/universal/constants';
import {
  ServerPlugin,
  Context,
  Middleware,
  ServerEnv,
  Render,
  UserConfig,
  CacheConfig,
} from '../../types';
import { ServerNodeEnv } from '../../adapters/node/hono';
import { initReporter } from '../monitor';
import { sortRoutes } from '../../utils';
import {
  getLoaderCtx,
  CustomServer,
  getServerMidFromUnstableMid,
} from '../customServer';
import { createRender } from './render';

export interface RenderPluginOptions {
  staticGenerate?: boolean;
  cacheConfig?: CacheConfig;
}

export const renderPlugin = (
  options: RenderPluginOptions = {},
): ServerPlugin => ({
  name: '@modern-js/plugin-render',

  setup(api) {
    const { staticGenerate, cacheConfig } = options;

    return {
      async prepare() {
        const {
          middlewares,
          routes,
          metaName,
          distDirectory: pwd,
          serverBase,
        } = api.useAppContext();
        const runner = api.useHookRunners();
        const config = api.useConfigContext();

        if (!routes) {
          return;
        }

        const customServer = new CustomServer(runner, serverBase!, pwd);

        const serverMiddleware =
          config.render?.middleware &&
          getServerMidFromUnstableMid(config.render.middleware);

        const pageRoutes = getPageRoutes(routes);

        const render = await getRenderHandler({
          pwd,
          routes,
          config,
          metaName,
          cacheConfig: config.render?.cache || cacheConfig,
          staticGenerate,
        });

        for (const route of pageRoutes) {
          const { urlPath: originUrlPath, entryName } = route;
          const urlPath = originUrlPath.endsWith('/')
            ? `${originUrlPath}*`
            : `${originUrlPath}/*`;

          middlewares.push({
            name: 'init-reporter',
            handler: initReporter(entryName || MAIN_ENTRY_NAME),
          });

          const customServerHookMiddleware = customServer.getHookMiddleware(
            entryName || 'main',
            routes,
          );

          middlewares.push({
            name: 'custom-server-hook',
            path: urlPath,
            handler: customServerHookMiddleware,
          });

          const customServerMiddleware =
            serverMiddleware || (await customServer.getServerMiddleware());

          customServerMiddleware &&
            middlewares.push({
              name: 'custom-server-middleware',
              path: urlPath,
              handler: customServerMiddleware,
            });

          middlewares.push({
            name: `render`,
            path: urlPath,
            handler: createRenderHandler(render),
          });
        }
      },
    };
  },
});

function getPageRoutes(routes: ServerRoute[]): ServerRoute[] {
  return (
    routes
      .filter(route => !route.isApi)
      // ensure route.urlPath.length diminishing
      .sort(sortRoutes)
  );
}

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
    const loaderContext = getLoaderCtx(c as Context);

    const request = c.req.raw;
    const nodeReq = c.env.node?.req;

    const res = await render(request, {
      logger,
      nodeReq,
      reporter,
      templates,
      metrics,
      serverManifest,
      loaderContext,
      locals,
    });

    const { body, status, headers } = res;

    const headersData: Record<string, string> = {};
    headers.forEach((v, k) => {
      headersData[k] = v;
    });

    return c.body(body, status, headersData);
  };
}

export interface GetRenderHandlerOptions {
  pwd: string;
  routes: ServerRoute[];
  config: UserConfig;
  cacheConfig?: CacheConfig;
  staticGenerate?: boolean;
  metaName?: string;
}

export async function getRenderHandler({
  pwd,
  routes,
  config,
  cacheConfig,
  metaName,
  staticGenerate,
}: GetRenderHandlerOptions): Promise<Render> {
  const ssrConfig = config.server?.ssr;
  const forceCSR = typeof ssrConfig === 'object' ? ssrConfig.forceCSR : false;

  const render = createRender({
    routes,
    pwd,
    // TODO: need static Genrate
    staticGenerate,
    cacheConfig,
    forceCSR,
    nonce: config.security?.nonce,
    metaName: metaName || 'modern-js',
  });

  return render;
}
