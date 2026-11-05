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
        // Hono accepts route paths and handles regex escaping internally.
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
    const nodeReq = c.env.node?.req;
    const nodeRes = c.env.node?.res;
    // `writeEarlyHints` exists on Node.js `ServerResponse` (>= 18.11) and on
    // the HTTP/2 compatibility API. Other runtimes skip early hints.
    const writeEarlyHints =
      typeof nodeRes?.writeEarlyHints === 'function'
        ? (links: string[]) => {
            if (!nodeRes.headersSent) {
              nodeRes.writeEarlyHints({ link: links });
            }
          }
        : undefined;

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
      writeEarlyHints,
    });

    const { body, status, headers } = res;

    const headersData: Record<string, string> = {};
    headers.forEach((v, k) => {
      headersData[k] = v;
    });

    return c.body(body!, status as ContentfulStatusCode, headersData);
  };
}
