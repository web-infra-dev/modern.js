import React from 'react';
import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
  createRoutesFromElements,
} from 'react-router-dom';
import hoistNonReactStatics from 'hoist-non-react-statics';
import type { Plugin } from '../../core';
import { renderRoutes, urlJoin } from './utils';
import type { RouterConfig } from './types';

export const routerPlugin = ({
  serverBase = [],
  supportHtml5History = true,
  basename = '',
  routesConfig,
  createRoutes,
}: RouterConfig): Plugin => {
  const select = (pathname: string) =>
    serverBase.find(baseUrl => pathname.search(baseUrl) === 0) || '/';
  return {
    name: '@modern-js/plugin-router',
    setup: () => {
      return {
        hoc: ({ App }, next) => {
          // can not get routes config, skip wrapping React Router.
          // e.g. App.tsx as the entrypoint
          if (!routesConfig && !createRoutes) {
            return next({ App });
          }

          const getRouteApp = () => {
            return (props => {
              const routes = createRoutes
                ? createRoutes()
                : createRoutesFromElements(renderRoutes(routesConfig));

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
