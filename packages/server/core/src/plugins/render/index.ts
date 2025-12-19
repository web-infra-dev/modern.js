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

const DYNAMIC_ROUTE_REG = /\/:./;

/**
 * Escape special regex characters in a path string.
 * This is needed because Hono's router converts paths to regex patterns,
 * and special characters like parentheses need to be escaped.
 */
function escapeRegexSpecialChars(path: string): string {
  // Escape special regex characters: ( ) [ ] { } * + ? . ^ $ | \
  return path.replace(/[()[\]{}*+?.^$|\\]/g, '\\$&');
}

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
          renderMiddlewares,
        } = api.useAppContext();
        // TODO: remove any
        const hooks = (api as any).getHooks();
        const config = api.useConfigContext();

        if (!routes) {
          return;
        }

        const customServer = new CustomServer(hooks, pwd);

        const pageRoutes = getPageRoutes(routes);

        middlewares.push({
          name: 'page-latency',
          handler: requestLatencyMiddleware(),
        });

        for (const route of pageRoutes) {
          const { urlPath: originUrlPath, entryName = MAIN_ENTRY_NAME } = route;
          const isDynamic = DYNAMIC_ROUTE_REG.test(originUrlPath);

          // For static routes, escape special regex characters to prevent regex syntax errors
          // For dynamic routes, keep as-is since they contain route parameters
          const escapedPath = isDynamic
            ? originUrlPath
            : escapeRegexSpecialChars(originUrlPath);

          const urlPath = escapedPath.endsWith('/')
            ? `${escapedPath}*`
            : `${escapedPath}/*`;

          // Hook middleware will handle stream as string and then handle it as stream, which will cause the performance problem
          // TODO: Hook middleware will be deprecated in next version
          if (config.server?.disableHook !== true) {
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

          // config.renderMiddlewares can register by server config and prepare hook
          renderMiddlewares?.forEach(m => {
            middlewares.push({
              name: m.name,
              path: urlPath,
              handler: m.handler,
            });
          });

          // TODO: Unstable middleware should be deprecated
          const customServerMiddleware =
            await customServer.getServerMiddleware();

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
