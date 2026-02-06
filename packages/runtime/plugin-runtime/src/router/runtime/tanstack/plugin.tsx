/// <reference path="./ssr-shim.d.ts" />

import { merge } from '@modern-js/runtime-utils/merge';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import {
  RouterProvider,
  createBrowserHistory,
  createHashHistory,
  createRouter,
  useLocation,
  useMatches,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { RouterClient } from '@tanstack/react-router/ssr/client';
import * as React from 'react';
import { useContext, useMemo } from 'react';
import type { RuntimePlugin } from '../../../core';
import {
  InternalRuntimeContext,
  getGlobalLayoutApp,
  getGlobalRoutes,
} from '../../../core/context';
import type { RouterConfig } from '../types';
import { createRouteObjectsFromConfig, urlJoin } from '../utils';
import { createModernBasepathRewrite } from './basepathRewrite';
import { createRouteTreeFromRouteObjects } from './routeTree';

function normalizeBase(b: string) {
  if (b.length > 1 && b.endsWith('/')) return b.slice(0, -1);
  return b || '/';
}

function isSegmentPrefix(pathname: string, base: string) {
  const b = normalizeBase(base);
  const p = pathname || '/';
  return p === b || p.startsWith(`${b}/`);
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

export const tanstackRouterPlugin = (
  userConfig: Partial<RouterConfig> = {},
): RuntimePlugin => {
  return {
    name: '@modern-js/plugin-router-tanstack',
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
        const mergedConfig = merge(
          api.getRuntimeConfig().router || {},
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

        const getRouteObjects = () => {
          if (typeof cachedRouteObjects !== 'undefined') {
            return cachedRouteObjects;
          }

          const routeObjects = createRoutes
            ? createRoutes()
            : (createRouteObjectsFromConfig({
                routesConfig: finalRouteConfig,
              }) || []);

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

        // Cache routeTree/router in closure to avoid recreating on re-render
        let cachedRouteTree: any = null;
        let cachedRouter: any = null;
        let cachedRouterBasepath: string | null = null;

        const RouterWrapper = () => {
          const runtimeContext = useContext(InternalRuntimeContext);

          const baseUrl = selectBasePath(location.pathname).replace(/^\/*/, '/');
          const _basename =
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
            const routeObjects = getRouteObjects();
            if (!routeObjects.length) {
              return null;
            }
            cachedRouteTree = createRouteTreeFromRouteObjects(routeObjects);
            return cachedRouteTree;
          }, []);

          if (!routeTree) {
            return App ? <App /> : null;
          }

          const router = useMemo(() => {
            if (cachedRouter && cachedRouterBasepath === _basename) {
              return cachedRouter;
            }

            const history = supportHtml5History
              ? createBrowserHistory()
              : createHashHistory();

            const rewrite = createModernBasepathRewrite(_basename);

            cachedRouter = createRouter({
              routeTree,
              basepath: '/',
              rewrite,
              history,
              context: {},
            });
            cachedRouterBasepath = _basename;

            return cachedRouter;
          }, [_basename, routeTree, supportHtml5History]);

          // TanStack SSR hydration sets window.$_TSR. If present, use RouterClient to hydrate.
          const hasSSRBootstrap =
            typeof window !== 'undefined' && (window as any).$_TSR;

          const RouterContent = hasSSRBootstrap
            ? (
                <React.Suspense fallback={null}>
                  <RouterClient router={router} />
                </React.Suspense>
              )
            : (
                <RouterProvider router={router} />
              );

          return App ? <App>{RouterContent}</App> : RouterContent;
        };

        return RouterWrapper as any;
      });
    },
  };
};
