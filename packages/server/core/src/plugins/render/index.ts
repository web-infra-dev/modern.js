import type { ServerRoute } from '@modern-js/types';
import { MAIN_ENTRY_NAME } from '@modern-js/utils/universal/constants';
import type { ServerNodeEnv } from '../../adapters/node/hono';
import { getLoaderCtx } from '../../helper';
import type {
  Context,
  Middleware,
  Render,
  ServerEnv,
  ServerPluginLegacy,
} from '../../types';
import { sortRoutes } from '../../utils';
import { CustomServer, getServerMidFromUnstableMid } from '../customServer';
import { requestLatencyMiddleware } from '../monitors';

export * from './inject';

export const renderPlugin = (): ServerPluginLegacy => ({
  name: '@modern-js/plugin-render',

  setup(api) {
    return {
      async prepare() {
        const {
          middlewares,
          routes,
          render,
          distDirectory: pwd,
          serverBase,
        } = api.useAppContext();
        // TODO: remove any
        const hooks = (api as any).getHooks();
        const config = api.useConfigContext();

        if (!routes) {
          return;
        }

        const customServer = new CustomServer(hooks, serverBase!, pwd);

        // render.middleware can register by server config and prepare hook
        // render.middleware is the same as unstable_middleware in server/index.ts, but execute before unstable_middleware
        // TODO：check api and add docs for render.middleware
        const serverMiddleware =
          config.render?.middleware &&
          getServerMidFromUnstableMid(config.render.middleware);

        const pageRoutes = getPageRoutes(routes);

        middlewares.push({
          name: 'page-latency',
          handler: requestLatencyMiddleware(),
        });

        for (const route of pageRoutes) {
          const { urlPath: originUrlPath, entryName = MAIN_ENTRY_NAME } = route;
          const urlPath = originUrlPath.endsWith('/')
            ? `${originUrlPath}*`
            : `${originUrlPath}/*`;

          // Hook middleware will handle stream as string and then handle it as stream, which will cause the performance problem
          // TODO: Hook middleware will be deprecated in next version
          if (config.server?.future_disableHookMiddleware !== true) {
            const customServerHookMiddleware = customServer.getHookMiddleware(
              entryName,
              routes,
            );

            middlewares.push({
              name: 'custom-server-hook',
              path: urlPath,
              handler: customServerHookMiddleware,
            });
          }

          const customServerMiddleware =
            await customServer.getServerMiddleware(serverMiddleware);

          customServerMiddleware &&
            middlewares.push({
              name: 'custom-server-middleware',
              path: urlPath,
              handler: customServerMiddleware,
            });

          render &&
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
    const monitors = c.get('monitors');
    const templates = c.get('templates') || {};
    const serverManifest = c.get('serverManifest') || {};
    const rscServerManifest = c.get('rscServerManifest');
    const rscClientManifest = c.get('rscClientManifest');
    const rscSSRManifest = c.get('rscSSRManifest');
    const locals = c.get('locals');
    const metrics = c.get('metrics');
    const matchPathname = c.get('matchPathname');
    const matchEntryName = c.get('matchEntryName');
    const loaderContext = getLoaderCtx(c as Context);

    const request = c.req.raw;
    const nodeReq = c.env.node?.req;

    const res = await render(request, {
      nodeReq,
      monitors,
      logger,
      reporter,
      templates,
      metrics,
      serverManifest,
      rscServerManifest,
      rscClientManifest,
      rscSSRManifest,
      loaderContext,
      locals,
      matchPathname,
      matchEntryName,
    });

    const { body, status, headers } = res;

    const headersData: Record<string, string> = {};
    headers.forEach((v, k) => {
      headersData[k] = v;
    });

    return c.body(body, status, headersData);
  };
}
