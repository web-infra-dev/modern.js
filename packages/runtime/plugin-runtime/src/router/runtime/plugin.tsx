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

let modifiableRoutesConfig: RouterConfig['routesConfig'];
let modifiable = true;

export type ModifyFn = (routesConfig: RouterConfig['routesConfig']) => RouterConfig['routesConfig'];

export const modifyRoutesConfig = (modifyFn: ModifyFn) => {
  if (modifiable) {
    modifiableRoutesConfig = modifyFn(modifiableRoutesConfig);
  } else {
    console.error('cannot modify routes during render');
  }
};

export const routerPlugin = ({
  serverBase = [],
  supportHtml5History = true,
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
          if (!routesConfig) {
            return next({ App });
          }
          
          modifiableRoutesConfig = routesConfig;

          const getRouteApp = () => {
            let router: any;

            return (props => {
              modifiable = false;
              
              if (!router) {
                const routes = createRoutes
                  ? createRoutes()
                  : createRoutesFromElements(renderRoutes(modifiableRoutesConfig));
                const baseUrl =
                  window._SERVER_DATA?.router.baseUrl ||
                  select(location.pathname);
                router = supportHtml5History
                  ? createBrowserRouter(routes, { basename: baseUrl })
                  : createHashRouter(routes, { basename: baseUrl });
              }

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
