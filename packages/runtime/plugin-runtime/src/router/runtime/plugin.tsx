import React from 'react';
import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
  createRoutesFromElements,
} from 'react-router-dom';
import hoistNonReactStatics from 'hoist-non-react-statics';
import type { Plugin } from '../../core';
import { renderRoutes } from './utils';
import type { RouterConfig } from './types';
import { createConfigRoutes } from './ConfigRoutes';

export const routerPlugin = ({
  serverBase = [],
  supportHtml5History = true,
  routesConfig,
  configRoutes,
}: RouterConfig): Plugin => {
  const select = (pathname: string) =>
    serverBase.find(baseUrl => pathname.search(baseUrl) === 0) || '/';
  return {
    name: '@modern-js/plugin-router',
    setup: () => {
      return {
        hoc: ({ App }, next) => {
          const getRouteApp = () => {
            return (props => {
              const routeElements = renderRoutes(routesConfig);
              const routes = configRoutes
                ? createRoutesFromElements(routeElements)
                : createConfigRoutes({ ...configRoutes, ...props });

              const baseUrl =
                window._SERVER_DATA?.router.baseUrl ||
                select(location.pathname);

              const router = supportHtml5History
                ? createBrowserRouter(routes, { basename: baseUrl })
                : createHashRouter(routes, { basename: baseUrl });

              return (
                <App {...props}>
                  <RouterProvider router={router} />
                </App>
              );
            }) as React.FC<any>;
          };

          const RouteApp = getRouteApp();

          if (routesConfig.globalApp) {
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
