import { useContext, useMemo } from 'react';
import {
  RouteObject,
  RouterProvider,
  createBrowserRouter,
  createHashRouter,
  createRoutesFromElements,
  useMatches,
  useLocation,
  useHref,
} from '@modern-js/runtime-utils/router';
import { RouterSubscriber } from '@modern-js/runtime-utils/remix-router';
import { Plugin } from '../../core/plugin';
import { RuntimeReactContext } from '../../core/context';
import { urlJoin } from './utils';
import { renderRoutes } from './component';
import { RouterConfig, Routes } from './types';
import { modifyRoutes as modifyRoutesHook } from './hooks';

export * from '@modern-js/runtime-utils/router';
export * from './module';
export type { RouterConfig } from './types';

// eslint-disable-next-line import/no-mutable-exports
export let finalRouteConfig: RouterConfig['routesConfig'] = {
  routes: [],
};

let beforeCreateRouter = true;
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
  routesConfig,
  serverBase = [],
  supportHtml5History = true,
  // when the current child app has multiple entries, there is a problem,
  // so we have added a new parameter, the parameter will replace basename and baseUrl after the major version.
  originalBaseUrl = '',
  basename = '',
  createRoutes,
}: RouterConfig): Plugin => {
  return {
    name: '@modern-js/plugin-router',
    registerHook: {
      modifyRoutes: modifyRoutesHook,
    },
    setup: api => {
      const select = (pathname: string) =>
        serverBase.find(baseUrl => pathname.search(baseUrl) === 0) || '/';
      let routes: RouteObject[] = [];
      finalRouteConfig = routesConfig;
      return {
        async init({ context }, next) {
          // garfish 插件需要使用
          context.router = {
            useMatches,
            useLocation,
            useHref,
          };

          Object.defineProperty(context, 'routes', {
            get() {
              return routes;
            },
          });
          return next({ context });
        },
        hoc({ App, config }, next) {
          // can not get routes config, skip wrapping React Router.
          // e.g. App.tsx as the entrypoint
          if (!finalRouteConfig.routes && !createRoutes) {
            return next({ App, config });
          }
          const getRouteApp = () => {
            const useCreateRouter = (props: any) => {
              const baseUrl =
                originalBaseUrl ||
                window._SERVER_DATA?.router.baseUrl ||
                select(location.pathname);
              const _basename =
                baseUrl === '/'
                  ? urlJoin(baseUrl, config.router?.basename || basename)
                  : baseUrl;

              const runtimeContext = useContext(RuntimeReactContext);

              const { unstable_getBlockNavState: getBlockNavState } =
                runtimeContext;

              return useMemo(() => {
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

                const router = supportHtml5History
                  ? createBrowserRouter(routes, {
                      basename: _basename,
                    })
                  : createHashRouter(routes, {
                      basename: _basename,
                    });

                const originSubscribe = router.subscribe;

                router.subscribe = (listener: RouterSubscriber) => {
                  const wrapedListener: RouterSubscriber = (...args) => {
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

                Object.defineProperty(runtimeContext, 'remixRouter', {
                  get() {
                    return router;
                  },
                  configurable: true,
                });

                return router;
              }, [finalRouteConfig, props, _basename, getBlockNavState]);
            };

            return (props => {
              beforeCreateRouter = false;
              const router = useCreateRouter(props);

              return (
                <App {...props}>
                  <RouterProvider router={router} />
                </App>
              );
            }) as React.FC<any>;
          };
          const RouteApp = getRouteApp();
          return next({ App: RouteApp, config });
        },
      };
    },
  };
};
