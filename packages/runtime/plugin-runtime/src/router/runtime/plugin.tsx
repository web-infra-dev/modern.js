import { merge } from '@modern-js/runtime-utils/merge';
import type { RouterSubscriber } from '@modern-js/runtime-utils/remix-router';
import {
  type RouteObject,
  RouterProvider,
  createBrowserRouter,
  createHashRouter,
  createRoutesFromElements,
  useHref,
  useLocation,
  useMatches,
} from '@modern-js/runtime-utils/router';
import { normalizePathname } from '@modern-js/runtime-utils/url';
import type React from 'react';
import { useContext, useMemo } from 'react';
import { type RuntimePluginFuture, RuntimeReactContext } from '../../core';
import { getGlobalLayoutApp, getGlobalRoutes } from '../../core/context';
import {
  type RouterExtendsHooks,
  modifyRoutes as modifyRoutesHook,
  onBeforeCreateRoutes as onBeforeCreateRoutesHook,
} from './hooks';
import type { RouterConfig, Routes } from './types';
import { deserializeErrors, renderRoutes, urlJoin } from './utils';

export let finalRouteConfig: RouterConfig['routesConfig'] = {
  routes: [],
};
export let beforeCreateRouter = true;
// support csr only, it is not allowed to use in ssr app.
// inhouse private, will deprecated
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

export const routerPlugin = (
  userConfig: Partial<RouterConfig> = {},
): RuntimePluginFuture<{
  extendHooks: RouterExtendsHooks;
}> => {
  return {
    name: '@modern-js/plugin-router',
    registryHooks: {
      modifyRoutes: modifyRoutesHook,
      onBeforeCreateRoutes: onBeforeCreateRoutesHook,
    },
    setup: api => {
      let routes: RouteObject[] = [];

      api.onBeforeRender(context => {
        // In some scenarios, the initial pathname and the current pathname do not match.
        // We add a configuration to support the page to reload.
        if (window._SSR_DATA && userConfig.unstable_reloadOnURLMismatch) {
          const { ssrContext } = context;
          const currentPathname = normalizePathname(window.location.pathname);
          const initialPathname =
            ssrContext?.request?.pathname &&
            normalizePathname(ssrContext.request.pathname);

          if (initialPathname && initialPathname !== currentPathname) {
            const errorMsg = `The initial URL ${initialPathname} and the URL ${currentPathname} to be hydrated do not match, reload.`;
            console.error(errorMsg);
            window.location.reload();
          }
        }

        // for garfish plugin to get basename,
        // why not let garfish plugin just import @modern-js/runtime/router
        // so the `router` has no type declare in RuntimeContext
        context.router = {
          useMatches,
          useLocation,
          useHref,
        };

        // Prefetch Link will use routes for match next route
        Object.defineProperty(context, 'routes', {
          get() {
            return routes;
          },
          enumerable: true,
        });
      });
      api.wrapRoot(App => {
        const pluginConfig: Record<string, any> = api.getRuntimeConfig();
        const {
          serverBase = [],
          supportHtml5History = true,
          basename = '',
          routesConfig,
          createRoutes,
          future,
        } = merge(pluginConfig.router || {}, userConfig) as RouterConfig;
        const select = (pathname: string) =>
          serverBase.find(baseUrl => pathname.search(baseUrl) === 0) || '/';
        finalRouteConfig = {
          routes: getGlobalRoutes(),
          globalApp: getGlobalLayoutApp(),
          ...routesConfig,
        };

        // can not get routes config, skip wrapping React Router.
        // e.g. App.tsx as the entrypoint
        if (!finalRouteConfig.routes && !createRoutes) {
          return App;
        }

        const getRouteApp = () => {
          const useCreateRouter = (props: any) => {
            const runtimeContext = useContext(RuntimeReactContext);
            /**
             * _internalRouterBaseName: garfish plugin params, priority
             * basename: modern config file config
             */
            const baseUrl = select(location.pathname).replace(/^\/*/, '/');
            const _basename =
              baseUrl === '/'
                ? urlJoin(
                    baseUrl,
                    runtimeContext._internalRouterBaseName || basename,
                  )
                : baseUrl;

            let hydrationData = window._ROUTER_DATA;

            const { unstable_getBlockNavState: getBlockNavState } =
              runtimeContext;

            return useMemo(() => {
              if (hydrationData?.errors) {
                hydrationData = {
                  ...hydrationData,
                  errors: deserializeErrors(hydrationData.errors),
                };
              }

              routes = createRoutes
                ? createRoutes()
                : createRoutesFromElements(
                    renderRoutes({
                      routesConfig: finalRouteConfig,
                      props,
                    }),
                  );

              const hooks = api.getHooks();
              // inhouse private, try deprecated, different from the export function
              routes = hooks.modifyRoutes.call(routes);

              const router = supportHtml5History
                ? createBrowserRouter(routes, {
                    basename: _basename,
                    hydrationData,
                  })
                : createHashRouter(routes, {
                    basename: _basename,
                    hydrationData,
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
                  return listener(...args);
                };
                return originSubscribe(wrapedListener);
              };

              return router;
            }, [
              finalRouteConfig,
              props,
              _basename,
              hydrationData,
              getBlockNavState,
            ]);
          };

          const Null = () => null;

          return (props => {
            beforeCreateRouter = false;
            const router = useCreateRouter(props);
            const routerWrapper = (
              // To match the node tree about https://github.com/web-infra-dev/modern.js/blob/v2.59.0/packages/runtime/plugin-runtime/src/router/runtime/plugin.node.tsx#L150-L168
              // According to react [useId generation algorithm](https://github.com/facebook/react/pull/22644), `useId` will generate id with the react node react struct.
              // To void hydration failed, we must guarantee that the node tree when browser hydrate must have same struct with node tree when ssr render.
              <>
                <RouterProvider router={router} future={future} />
                <Null />
                <Null />
              </>
            );

            return App ? <App>{routerWrapper}</App> : routerWrapper;
          }) as React.ComponentType<any>;
        };

        return getRouteApp();
      });
    },
  };
};
