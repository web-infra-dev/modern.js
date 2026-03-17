import { merge } from '@modern-js/runtime-utils/merge';
import {
  RouterProvider,
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory,
  createRouter,
  useLocation,
  useMatches,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import type { RouteObject } from '@modern-js/runtime/router';
import {
  type RouterConfig,
  type RuntimePlugin,
  type TRuntimeContext,
} from '@modern-js/runtime';
import {
  InternalRuntimeContext,
  getGlobalLayoutApp,
  getGlobalRoutes,
} from '@modern-js/runtime/context';
import {
  createRouteObjectsFromConfig,
  urlJoin,
} from '@modern-js/runtime/router/internal';
import * as React from 'react';
import { useContext, useMemo } from 'react';
import { createModernBasepathRewrite } from './basepathRewrite';
import {
  modifyRoutes as modifyRoutesHook,
  onBeforeCreateRoutes as onBeforeCreateRoutesHook,
} from './hooks';
import type { TanstackRouterExtendsHooks } from './hooks';
import { createRouteTreeFromRouteObjects } from './routeTree';

function normalizeBase(base: string) {
  if (base.length > 1 && base.endsWith('/')) return base.slice(0, -1);
  return base || '/';
}

function isSegmentPrefix(pathname: string, base: string) {
  const normalizedBase = normalizeBase(base);
  const normalizedPathname = pathname || '/';
  return (
    normalizedPathname === normalizedBase ||
    normalizedPathname.startsWith(`${normalizedBase}/`)
  );
}

function stripSyntheticNotFoundRoute(routes: RouteObject[]): RouteObject[] {
  return routes
    .filter(route => !(route.path === '*' && !route.id && !route.loader))
    .map(route => {
      if (!route.children?.length) {
        return route;
      }
      return {
        ...route,
        children: stripSyntheticNotFoundRoute(route.children),
      };
    });
}

export interface TanstackRouterRuntimeConfig extends Partial<RouterConfig> {
  routesDir?: string;
}

export const tanstackRouterPlugin = (
  userConfig: TanstackRouterRuntimeConfig = {},
): RuntimePlugin<{
  extendHooks: TanstackRouterExtendsHooks;
}> => {
  return {
    name: '@modern-js/plugin-tanstack',
    registryHooks: {
      modifyRoutes: modifyRoutesHook,
      onBeforeCreateRoutes: onBeforeCreateRoutesHook,
    },
    setup: api => {
      api.onBeforeRender(context => {
        context.router = {
          useMatches,
          useLocation,
          useNavigate,
          useRouter,
        };
      });

      api.wrapRoot(App => {
        const runtimeConfig = api.getRuntimeConfig() as Record<string, any>;
        const mergedConfig = merge(
          runtimeConfig.tanstackRouter || {},
          userConfig,
        ) as RouterConfig;

        const {
          serverBase = [],
          supportHtml5History = true,
          basename = '',
          routesConfig,
          createRoutes,
        } = mergedConfig;

        const finalRouteConfig = {
          routes: getGlobalRoutes(),
          globalApp: getGlobalLayoutApp(),
          ...routesConfig,
        };

        if (!finalRouteConfig.routes && !createRoutes) {
          return App;
        }

        const hooks = api.getHooks() as any;
        let cachedRouteObjects: RouteObject[] | undefined;

        const getRouteObjects = (context: TRuntimeContext) => {
          if (typeof cachedRouteObjects !== 'undefined') {
            return cachedRouteObjects;
          }

          hooks.onBeforeCreateRoutes.call(context);
          const routeObjects = createRoutes
            ? createRoutes()
            : createRouteObjectsFromConfig({
                routesConfig: finalRouteConfig,
              }) || [];

          const normalizedRouteObjects = createRoutes
            ? routeObjects
            : stripSyntheticNotFoundRoute(routeObjects);

          cachedRouteObjects = hooks.modifyRoutes.call(
            normalizedRouteObjects,
          ) as RouteObject[];
          return cachedRouteObjects;
        };

        const selectBasePath = (pathname: string) => {
          const match = serverBase.find(baseUrl =>
            isSegmentPrefix(pathname, baseUrl),
          );
          return match || '/';
        };

        let cachedRouteTree: any = null;
        let cachedRouter: any = null;
        let cachedRouterBasepath: string | null = null;

        const RouterWrapper = () => {
          const runtimeContext = useContext(
            InternalRuntimeContext,
          ) as unknown as TRuntimeContext & {
            _internalRouterBaseName?: string;
          };

          const isBrowser = typeof window !== 'undefined';
          const requestPathname =
            runtimeContext.request instanceof Request
              ? new URL(runtimeContext.request.url).pathname
              : '/';
          const pathname = isBrowser ? location.pathname : requestPathname;
          const baseUrl = selectBasePath(pathname).replace(/^[\\/]*/, '/');
          const resolvedBasename =
            baseUrl === '/'
              ? urlJoin(
                  baseUrl,
                  runtimeContext._internalRouterBaseName || basename || '',
                )
              : baseUrl;

          const routeTree = useMemo(() => {
            if (cachedRouteTree) {
              return cachedRouteTree;
            }

            const routeObjects = getRouteObjects(runtimeContext);
            if (!routeObjects.length) {
              return null;
            }

            cachedRouteTree = createRouteTreeFromRouteObjects(routeObjects);
            return cachedRouteTree;
          }, [runtimeContext]);

          if (!routeTree) {
            return App ? <App /> : null;
          }

          const router = useMemo(() => {
            if (cachedRouter && cachedRouterBasepath === resolvedBasename) {
              return cachedRouter;
            }

            const history = isBrowser
              ? supportHtml5History
                ? createBrowserHistory()
                : createHashHistory()
              : createMemoryHistory({
                  initialEntries: [pathname || '/'],
                });
            const rewrite = createModernBasepathRewrite(resolvedBasename);

            cachedRouter = createRouter({
              routeTree,
              basepath: '/',
              rewrite,
              history,
              context: {},
            });
            cachedRouterBasepath = resolvedBasename;

            return cachedRouter;
          }, [resolvedBasename, routeTree, supportHtml5History]);

          const routerContent = <RouterProvider router={router} />;
          return App ? <App>{routerContent}</App> : routerContent;
        };

        return RouterWrapper as any;
      });
    },
  };
};
