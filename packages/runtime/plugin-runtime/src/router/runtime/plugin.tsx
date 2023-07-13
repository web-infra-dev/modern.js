import React, { useContext } from 'react';
import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
  createRoutesFromElements,
  useMatches,
  useLocation,
  RouteObject,
} from '@modern-js/utils/runtime/router';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { parsedJSONFromElement } from '@modern-js/utils/runtime-browser';
import type { RouterSubscriber } from '@modern-js/utils/runtime/remix-router';
import { Plugin, RuntimeReactContext } from '../../core';
import { modifyRoutes as modifyRoutesHook } from './hooks';
import { deserializeErrors, renderRoutes, urlJoin } from './utils';
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
  let routes: RouteObject[] = [];
  finalRouteConfig = routesConfig;
  window._SERVER_DATA = parsedJSONFromElement('__MODERN_SERVER_DATA__');

  return {
    name: '@modern-js/plugin-router',
    registerHook: {
      modifyRoutes: modifyRoutesHook,
    },
    setup: api => {
      return {
        init({ context }, next) {
          context.router = {
            useMatches,
            useLocation,
          };

          Object.defineProperty(context, 'routes', {
            get() {
              return routes;
            },
          });

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
              beforeCreateRouter = false;
              routes = createRoutes
                ? createRoutes()
                : createRoutesFromElements(
                    renderRoutes({
                      routesConfig: finalRouteConfig,
                      props,
                    }),
                  );

              const runner = (api as any).useHookRunners();
              routes = runner.modifyRoutes(routes);

              const baseUrl =
                window._SERVER_DATA?.router.baseUrl ||
                select(location.pathname);
              const _basename =
                baseUrl === '/' ? urlJoin(baseUrl, basename) : baseUrl;

              let hydrationData = window._ROUTER_DATA;
              if (hydrationData?.errors) {
                hydrationData = {
                  ...hydrationData,
                  errors: deserializeErrors(hydrationData.errors),
                };
              }

              const router = supportHtml5History
                ? createBrowserRouter(routes, {
                    basename: _basename,
                    hydrationData,
                  })
                : createHashRouter(routes, {
                    basename: _basename,
                    hydrationData,
                  });

              const runtimeContext = useContext(RuntimeReactContext);
              if (!runtimeContext.remixRouter) {
                Object.defineProperty(runtimeContext, 'remixRouter', {
                  get() {
                    return router;
                  },
                });
              }

              const originSubscribe = router.subscribe;

              router.subscribe = (listener: RouterSubscriber) => {
                const wrapedListener: RouterSubscriber = (...args) => {
                  const getBlockNavState =
                    runtimeContext.unstable_getBlockNavState;

                  const blockRoute = getBlockNavState
                    ? getBlockNavState()
                    : false;

                  if (blockRoute) {
                    return;
                  }
                  // eslint-disable-next-line consistent-return
                  return listener(...args);
                };
                return originSubscribe(wrapedListener);
              };

              return (
                <App {...props}>
                  <RouterProvider router={router} />
                </App>
              );
            }) as React.FC<any>;
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
        pickContext: ({ context, pickedContext }, next) => {
          const { remixRouter } = context;

          // only export partial common API from remix-router
          const router = {
            navigate: remixRouter!.navigate,
            get location() {
              return remixRouter!.state.location;
            },
          };

          return next({
            context,
            pickedContext: {
              ...pickedContext,
              router,
            },
          });
        },
      };
    },
  };
};
