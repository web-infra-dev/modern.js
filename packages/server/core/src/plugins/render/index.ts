import type { ServerRoute } from '@modern-js/types';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ServerNodeEnv } from '../../adapters/node/hono';
import { getLoaderCtx } from '../../helper';
import type {
  Context,
  Middleware,
  Render,
  ServerEnv,
  ServerPlugin,
} from '../../types';
import { sortRoutes } from '../../utils';
import { requestLatencyMiddleware } from '../monitors';

export * from './inject';

export const renderPlugin = (): ServerPlugin => ({
  name: '@modern-js/plugin-render',

  setup(api) {
    api.onPrepare(async () => {
      const { middlewares, routes, render, renderMiddlewares } =
        api.getServerContext();

      if (!routes) {
        return;
      }

      const pageRoutes = getPageRoutes(routes);

      middlewares.push({
        name: 'page-latency',
        handler: requestLatencyMiddleware(),
      });

      for (const route of pageRoutes) {
        const { urlPath: originUrlPath } = route;
        const urlPath = originUrlPath.endsWith('/')
          ? `${originUrlPath}*`
          : `${originUrlPath}/*`;

        // config.renderMiddlewares can register by server config and prepare hook
        renderMiddlewares?.forEach(m => {
          middlewares.push({
            name: m.name,
            path: urlPath,
            handler: m.handler,
          });
        });

        render &&
          middlewares.push({
            name: `render`,
            path: urlPath,
            handler: createRenderHandler(render),
          });
      }
    });
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
    const contextForceCSR = c.get('forceCSR');

    const request = c.req.raw;
    const bindings = c.env;
    const nodeReq = bindings.node?.req;

    const res = await render(request, {
      nodeReq,
      monitors,
      templates,
      serverManifest,
      rscServerManifest,
      rscClientManifest,
      rscSSRManifest,
      loaderContext,
      locals,
      matchPathname,
      matchEntryName,
      contextForceCSR,
      reporter,
      bindings,
    });

    const { body, status, headers } = res;

    const headersData: Record<string, string> = {};
    headers.forEach((v, k) => {
      headersData[k] = v;
    });

    return c.body(body!, status as ContentfulStatusCode, headersData);
  };
}
