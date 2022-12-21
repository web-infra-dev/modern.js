import React, { useContext } from 'react';
import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
  createRoutesFromElements,
  useMatches,
  useLocation,
} from 'react-router-dom';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { Plugin, RuntimeReactContext } from '../../core';
import { renderRoutes, urlJoin } from './utils';
import type { RouterConfig, Routes } from './types';

// eslint-disable-next-line import/no-mutable-exports
export let finalRouteConfig: RouterConfig['routesConfig'] = {
  routes: [],
};
// eslint-disable-next-line import/no-mutable-exports
export let beforeCreateRouter = true;
// support csr only, it is not allowed to use in ssr app.
export function modifyRoutes(modifyFunction: (routes: Routes) => Routes) {
  if (beforeCreateRouter) {
    const { routes: originRoutes } = finalRouteConfig;
    const newRoutes = modifyFunction(originRoutes);
    finalRouteConfig.routes = newRoutes;
  } else {
    console.error(
      'It is not allowed to modify routes config after create router.',
    );
  }
}

export const routerPlugin = ({
  serverBase = [],
  supportHtml5History = true,
  basename = '',
  routesConfig,
  createRoutes,
}: RouterConfig): Plugin => {
  const select = (pathname: string) =>
    serverBase.find(baseUrl => pathname.search(baseUrl) === 0) || '/';
  finalRouteConfig = routesConfig;
  return {
    name: '@modern-js/plugin-router',
    setup: () => {
      return {
        init({ context }, next){
          context.router = {
            useMatches,
            useLocation
          };
          return next({ context });
        },
        hoc: ({ App }, next) => {
          // can not get routes config, skip wrapping React Router.
          // e.g. App.tsx as the entrypoint
          if (!finalRouteConfig && !createRoutes) {
            return next({ App });
          }

          const getRouteApp = () => {
            return (props => {
              beforeCreateRouter = true;
              const routes = createRoutes
                ? createRoutes()
                : createRoutesFromElements(renderRoutes(finalRouteConfig));

              const baseUrl =
                window._SERVER_DATA?.router.baseUrl ||
                select(location.pathname);
              const _basename =
                baseUrl === '/' ? urlJoin(baseUrl, basename) : baseUrl;

              const router = supportHtml5History
                ? createBrowserRouter(routes, { basename: _basename })
                : createHashRouter(routes, { basename: _basename });

                return (
                <App {...props}>
                  <RouterProvider router={router} />
                </App>
              );
            }) as React.FC<any>;
          };
          const RouteApp = getRouteApp();

          if (routesConfig?.globalApp) {
            return next({
              App: hoistNonReactStatics(RouteApp, routesConfig.globalApp),
            });
          }

          return next({
            App: RouteApp,
          });
        },
      };
    },
  };
};
