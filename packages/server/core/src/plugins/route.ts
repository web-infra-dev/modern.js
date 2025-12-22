import type { ServerRoute } from '@modern-js/types';
import { MAIN_ENTRY_NAME } from '@modern-js/utils/universal/constants';
import type { Middleware, ServerEnv, ServerPluginLegacy } from '../types';
import { sortRoutes } from '../utils';

function injectRoute(route: {
  entryName: string;
  urlPath: string;
}): Middleware<ServerEnv> {
  return async (c, next) => {
    if (route && !c.get('route')) {
      c.set('route', route);
    }

    await next();
  };
}

function getPageRoutes(routes: ServerRoute[]): ServerRoute[] {
  return (
    routes
      .filter(route => route.entryName)
      // ensure route.urlPath.length diminishing
      .sort(sortRoutes)
  );
}

export const injectRoutePlugin = (): ServerPluginLegacy => ({
  name: '@modern-js/plugin-inject-route',

  setup(api) {
    return {
      async prepare() {
        const { middlewares, routes } = api.useAppContext();

        if (!routes) {
          return;
        }

        const pageRoutes = getPageRoutes(routes);
        // inject current route info into hono context
        for (const route of pageRoutes) {
          const { urlPath: originUrlPath, entryName = MAIN_ENTRY_NAME } = route;
          const urlPath = originUrlPath.endsWith('/')
            ? `${originUrlPath}*`
            : `${originUrlPath}/*`;

          middlewares.push({
            name: 'inject-route-info',
            path: urlPath,
            handler: injectRoute({ entryName, urlPath: originUrlPath }),
          });
        }
      },
    };
  },
});
