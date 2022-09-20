import React, { useContext } from 'react';
import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
  createRoutesFromElements,
} from 'react-router-dom';
import type { RouteProps } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { RuntimeReactContext, ServerRouterContext } from '../../core';
import type { Plugin } from '../../core';
import { isBrowser } from '../../common';
import { renderRoutes, getLocation, urlJoin } from './utils';

declare global {
  interface Window {
    _SERVER_DATA?: {
      router: {
        baseUrl: string;
        params: Record<string, string>;
      };
    };
  }
}

export type SingleRouteConfig = RouteProps & {
  redirect?: string;
  routes?: SingleRouteConfig[];
  key?: string;

  /**
   * layout component
   */
  layout?: React.ComponentType;

  /**
   * component would be rendered when route macthed.
   */
  component?: React.ComponentType;
};

export type RouterConfig = {
  routesConfig?: {
    globalApp?: React.ComponentType<any>;
    routes?: SingleRouteConfig[];
  };
  serverBase?: string[];
  supportHtml5History: boolean;
};

export const routerPlugin = ({
  serverBase = [],
  supportHtml5History = true,
  routesConfig,
}: RouterConfig): Plugin => {
  const isBrow = isBrowser();

  const select = (pathname: string) =>
    serverBase.find(baseUrl => pathname.search(baseUrl) === 0) || '/';
  return {
    name: '@modern-js/plugin-router',
    setup: () => {
      return {
        hoc: ({ App }, next) => {
          const getRouteApp = () => {
            // client router
            if (isBrow) {
              const baseUrl =
                window._SERVER_DATA?.router.baseUrl ||
                select(location.pathname);

              const routerElement = (props: any) =>
                createRoutesFromElements(
                  <App {...props}>
                    {routesConfig ? renderRoutes(routesConfig, props) : null}
                  </App>,
                );

              const routerConfig = {
                basename: baseUrl,
              };

              const router = (props: any) =>
                supportHtml5History
                  ? createBrowserRouter(routerElement(props), routerConfig)
                  : createHashRouter(routerElement(props), routerConfig);

              return (props: any) => <RouterProvider router={router(props)} />;
            }
            return (props: any) => {
              const runtimeContext = useContext(RuntimeReactContext);
              const { ssrContext } = runtimeContext;
              const location = getLocation(ssrContext);
              const routerContext = ssrContext?.redirection || {};
              const request = ssrContext?.request;
              const baseUrl = request?.baseUrl as string;
              const basename = baseUrl === '/' ? urlJoin(baseUrl) : baseUrl;
              return (
                <ServerRouterContext.Provider value={routerContext}>
                  <StaticRouter
                    basename={basename === '/' ? '' : basename}
                    location={location}
                  >
                    <App {...props}>
                      {routesConfig ? renderRoutes(routesConfig, props) : null}
                    </App>
                  </StaticRouter>
                </ServerRouterContext.Provider>
              );
            };
          };
          let RouteApp = getRouteApp();

          if (App) {
            RouteApp = hoistNonReactStatics(RouteApp, App);
          }

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
