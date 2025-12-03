import type { RuntimePluginAPI } from '@modern-js/plugin/runtime';
import { merge } from '@modern-js/runtime-utils/merge';
import type { RouterSubscriber } from '@modern-js/runtime-utils/router';
import {
  type RouteObject,
  RouterProvider,
  type RouterProviderProps,
  createBrowserRouter,
  createHashRouter,
  createRoutesFromElements,
  useHref,
  useLocation,
  useMatches,
} from '@modern-js/runtime-utils/router';
import { normalizePathname } from '@modern-js/runtime-utils/url';
import * as React from 'react';
import { useContext, useEffect, useMemo } from 'react';
import { RuntimeContext, type RuntimePlugin } from '../../core';
import {
  InternalRuntimeContext,
  getGlobalLayoutApp,
  getGlobalRoutes,
} from '../../core/context';
import { getGlobalIsRscClient } from '../../core/context';
import type { TInternalRuntimeContext } from '../../core/context/runtime';
import {
  type RouterExtendsHooks,
  modifyRoutes as modifyRoutesHook,
  onBeforeCreateRoutes as onBeforeCreateRoutesHook,
} from './hooks';
import { createClientRouterFromPayload } from './rsc-router';
import type { RouterConfig, Routes } from './types';
import {
  createRouteObjectsFromConfig,
  deserializeErrors,
  renderRoutes,
  urlJoin,
} from './utils';

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

type RouterPluginAPI = RuntimePluginAPI<{
  extendHooks: RouterExtendsHooks;
}>;

interface UseRouterCreationOptions {
  api: RouterPluginAPI;
  createRoutes?: RouterConfig['createRoutes'];
  supportHtml5History: boolean;
  selectBasePath: (pathname: string) => string;
  basename: string;
}

export const routerPlugin = (
  userConfig: Partial<RouterConfig> = {},
): RuntimePlugin<{
  extendHooks: RouterExtendsHooks;
}> => {
  return {
    name: '@modern-js/plugin-router',
    registryHooks: {
      modifyRoutes: modifyRoutesHook,
      onBeforeCreateRoutes: onBeforeCreateRoutesHook,
    },
    setup: api => {
      const routesContainer = {
        current: [] as RouteObject[],
      };

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
            return routesContainer.current;
          },
          enumerable: true,
        });
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

        finalRouteConfig = {
          routes: getGlobalRoutes(),
          globalApp: getGlobalLayoutApp(),
          ...routesConfig,
        };

        if (!finalRouteConfig.routes && !createRoutes) {
          return App;
        }

        const selectBasePath = (pathname: string) => {
          const match = serverBase.find(baseUrl =>
            isSegmentPrefix(pathname, baseUrl),
          );
          return match || '/';
        };

        // Cache router instance in closure to avoid recreating on parent re-render
        let cachedRouter: any = null;

        const RouterWrapper = (props: any) => {
          const routerResult = useRouterCreation(
            {
              ...props,
              rscPayload: props?.rscPayload,
            },
            {
              api: api as any,
              createRoutes,
              supportHtml5History,
              selectBasePath,
              basename,
            },
          );

          // Only cache router instance, routes are always from routerResult
          // rscPayload is stable after first render, so we only create router once
          const router = useMemo(() => {
            if (cachedRouter) {
              return cachedRouter;
            }

            cachedRouter = routerResult.router;
            return cachedRouter;
          }, []);
          const { routes } = routerResult;

          routesContainer.current = routes;

          beforeCreateRouter = false;

          // To match the node tree about https://github.com/web-infra-dev/modern.js/blob/v2.59.0/packages/runtime/plugin-runtime/src/router/runtime/plugin.node.tsx#L150-L168
          // According to react [useId generation algorithm](https://github.com/facebook/react/pull/22644), `useId` will generate id with the react node react struct.
          // To void hydration failed, we must guarantee that the node tree when browser hydrate must have same struct with node tree when ssr render.
          const RouterContent = () => (
            <>
              <RouterProvider router={router} />
              <EmptyComponent />
              <EmptyComponent />
            </>
          );

          return App ? (
            <App>
              <RouterContent />
            </App>
          ) : (
            <RouterContent />
          );
        };

        return RouterWrapper;
      });
    },
  };
};

const EmptyComponent = () => null;

const safeUse = (promise: Promise<unknown>) => {
  const useProp = 'use';
  const useHook = React && (React as any)[useProp];
  if (typeof useHook === 'function') {
    return useHook(promise);
  }
  return null;
};

function normalizeBase(b: string) {
  if (b.length > 1 && b.endsWith('/')) return b.slice(0, -1);
  return b || '/';
}

function isSegmentPrefix(pathname: string, base: string) {
  const b = normalizeBase(base);
  const p = pathname || '/';
  return p === b || p.startsWith(`${b}/`);
}

function useRouterCreation(props: any, options: UseRouterCreationOptions) {
  const { api, createRoutes, supportHtml5History, selectBasePath, basename } =
    options;
  const runtimeContext = useContext(InternalRuntimeContext);

  const baseUrl = selectBasePath(location.pathname).replace(/^\/*/, '/');
  const _basename =
    baseUrl === '/'
      ? urlJoin(
          baseUrl,
          runtimeContext._internalRouterBaseName || basename || '',
        )
      : baseUrl;

  const { unstable_getBlockNavState: getBlockNavState } = runtimeContext;
  const rscPayload = props?.rscPayload ? safeUse(props.rscPayload) : null;

  let hydrationData = window._ROUTER_DATA || rscPayload;

  return useMemo(() => {
    if (hydrationData?.errors) {
      hydrationData = {
        ...hydrationData,
        errors: deserializeErrors(hydrationData.errors),
      };
    }

    const isRscClient = getGlobalIsRscClient();

    let routes: RouteObject[] | null = null;
    if (isRscClient) {
      routes = createRoutes
        ? createRoutes()
        : createRouteObjectsFromConfig({
            routesConfig: finalRouteConfig,
          });
    } else {
      routes = createRoutes
        ? createRoutes()
        : createRoutesFromElements(
            renderRoutes({
              routesConfig: finalRouteConfig,
              props,
            }),
          );
    }

    if (!routes) {
      routes = [];
    }

    const hooks = api.getHooks();

    if (rscPayload) {
      try {
        const router = createClientRouterFromPayload(
          rscPayload,
          routes,
          _basename,
        );

        return {
          router,
          routes: router.routes || [],
        };
      } catch (e) {
        console.error('Failed to create router from RSC payload:', e);
      }
    }

    const modifiedRoutes = hooks.modifyRoutes.call(routes);

    const router = supportHtml5History
      ? createBrowserRouter(modifiedRoutes, {
          basename: _basename,
          hydrationData,
        })
      : createHashRouter(modifiedRoutes, {
          basename: _basename,
          hydrationData,
        });

    const originSubscribe = router.subscribe;
    router.subscribe = (listener: RouterSubscriber) => {
      const wrappedListener: RouterSubscriber = (...args) => {
        const blockRoute = getBlockNavState ? getBlockNavState() : false;
        if (blockRoute) {
          return;
        }
        return listener(...args);
      };
      return originSubscribe(wrappedListener);
    };

    return {
      router,
      routes: modifiedRoutes,
    };
  }, [finalRouteConfig, props, _basename, hydrationData, getBlockNavState]);
}
