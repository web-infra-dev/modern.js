import { getApplicationRoutes } from './application';
import type { RuntimePluginAPI } from '@modern-js/plugin/runtime';
import { merge } from '@modern-js/runtime-utils/merge';
import type { RouterSubscriber } from '@modern-js/runtime-utils/router';
import {
  type RouteObject,
  RouterProvider,
  type RouterProviderProps,
  createBrowserRouter,
  createHashRouter,
  createMemoryRouter,
  createRoutesFromElements,
  useHref,
  useLocation,
  useMatches,
} from '@modern-js/runtime-utils/router';
import { normalizePathname } from '@modern-js/runtime-utils/url';
import * as React from 'react';
import { useContext, useMemo } from 'react';
import type { RuntimePlugin } from '../../core';
import { InternalRuntimeContext } from '../../core/context';
import { type RouterExtendsHooks, createRouterHooks } from './hooks';
import {
  ActiveMemoryRouteContext,
  MemoryRouteContext,
  type MemoryRouteState,
  normalizeMemoryRouterConfig,
} from './memory';
import { createClientRouterFromPayload } from './rsc-router';
import type { MemoryRouterConfig, RouterConfig } from './types';
import { scopeTopology, assertScopeTopology } from './scope';
import {
  createRouteObjectsFromConfig,
  deserializeErrors,
  renderRoutes,
  urlJoin,
} from './utils';

type RouterPluginAPI = RuntimePluginAPI<{
  extendHooks: RouterExtendsHooks;
}>;

interface UseRouterCreationOptions {
  api: RouterPluginAPI;
  createRoutes?: RouterConfig['createRoutes'];
  supportHtml5History: boolean;
  memory?: MemoryRouterConfig;
  selectBasePath: (pathname: string) => string;
  basename: string;
  routesConfig: RouterConfig['routesConfig'];
  selected?: boolean;
}

export const routerPlugin = (
  userConfig: Partial<RouterConfig> = {},
): RuntimePlugin<{
  extendHooks: RouterExtendsHooks;
}> => {
  return {
    name: '@modern-js/plugin-router',
    registryHooks: createRouterHooks,
    setup: api => {
      api.onBeforeRender(context => {
        const mergedRouterConfig = merge(
          api.getRuntimeConfig().router || {},
          userConfig,
        ) as RouterConfig;
        const isMemoryRouter = Boolean(
          context._internalMemoryRoute ?? mergedRouterConfig.memory,
        );
        // In some scenarios, the initial pathname and the current pathname do not match.
        // We add a configuration to support the page to reload.
        if (
          !isMemoryRouter &&
          context.application?.output === 'document' &&
          context.ssr &&
          userConfig.unstable_reloadOnURLMismatch
        ) {
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
            return context.application?.routes;
          },
          enumerable: true,
        });
      });
      api.wrapRoot(App => {
        const context = api.getRuntimeContext();
        const application = context.application!;
        const selected = application.definition.selected;
        const mergedConfig = merge(
          api.getRuntimeConfig().router || {},
          userConfig,
        ) as RouterConfig;
        const {
          serverBase = [],
          supportHtml5History = true,
          memory,
          basename = '',
          routesConfig,
          createRoutes,
          future,
        } = mergedConfig;
        const useTransitions =
          mergedConfig.useTransitions ?? future?.v7_startTransition;

        const rootRouteConfig = {
          ...getApplicationRoutes(context),
          ...(!selected && routesConfig),
        };
        application.config = rootRouteConfig;

        if (!rootRouteConfig.routes && !createRoutes) {
          return App;
        }
        if (selected && createRoutes)
          throw new Error(
            'createRoot route exports cannot replace the build-time graph with router.createRoutes.',
          );

        const releaseRouter = (application.releaseRouter = () => {
          const router = application.router;
          application.router = undefined;
          application.routes = undefined;
          router?.dispose();
        });
        api.onDispose(releaseRouter);

        const selectBasePath = (pathname: string) => {
          const match = serverBase.find(baseUrl =>
            isSegmentPrefix(pathname, baseUrl),
          );
          return match || '/';
        };

        const RouterWrapper = (props: any) => {
          const routerResult = useRouterCreation(
            process.env.MODERN_ENABLE_RSC
              ? {
                  ...props,
                  rscPayload: props?.rscPayload,
                }
              : props,
            {
              api: api as any,
              createRoutes,
              supportHtml5History,
              memory,
              selectBasePath,
              basename,
              routesConfig: rootRouteConfig,
              selected,
            },
          );

          const { router, memoryState } = routerResult;

          // To match the node tree about https://github.com/web-infra-dev/modern.js/blob/v2.59.0/packages/runtime/plugin-runtime/src/router/runtime/plugin.node.tsx#L150-L168
          // According to react [useId generation algorithm](https://github.com/facebook/react/pull/22644), `useId` will generate id with the react node react struct.
          // To void hydration failed, we must guarantee that the node tree when browser hydrate must have same struct with node tree when ssr render.
          return App ? (
            <App>
              <RouterContent
                router={router}
                useTransitions={useTransitions}
                memoryState={memoryState}
              />
            </App>
          ) : (
            <RouterContent
              router={router}
              useTransitions={useTransitions}
              memoryState={memoryState}
            />
          );
        };

        return RouterWrapper;
      });
    },
  };
};

const EmptyComponent = () => null;
const RouterContent = ({
  router,
  useTransitions,
  memoryState,
}: RouterProviderProps & { memoryState: MemoryRouteState }) => (
  <ActiveMemoryRouteContext.Provider value={memoryState}>
    <RouterProvider router={router} useTransitions={useTransitions} />
    <EmptyComponent />
    <EmptyComponent />
  </ActiveMemoryRouteContext.Provider>
);

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
  const {
    api,
    createRoutes,
    supportHtml5History,
    memory,
    selectBasePath,
    basename,
    routesConfig,
  } = options;
  const runtimeContext = useContext(InternalRuntimeContext);
  const memoryRouteContext = useContext(MemoryRouteContext);
  const scope = runtimeContext.application;

  const memoryInput: MemoryRouterConfig | undefined =
    props?.memoryRoute ??
    memoryRouteContext ??
    runtimeContext._internalMemoryRoute ??
    memory;

  const baseUrl = selectBasePath(location.pathname).replace(/^\/*/, '/');
  const defaultBasename =
    scope?.basename ??
    (baseUrl === '/'
      ? urlJoin(
          baseUrl,
          runtimeContext._internalRouterBaseName || basename || '',
        )
      : baseUrl);

  const currentBrowserPath = `${location.pathname}${location.search}${location.hash}`;
  const normalizedMemory =
    scope?.output === 'fragment'
      ? undefined
      : normalizeMemoryRouterConfig(
          memoryInput,
          currentBrowserPath,
          defaultBasename,
        );
  const _basename = normalizedMemory?.basename ?? defaultBasename;
  if (scope) scope.basename = _basename;
  const memoryState: MemoryRouteState = scope?.memory
    ? {
        enabled: true,
        initialEntries: [scope.initialUrl],
        initialIndex: 0,
        basename: _basename,
      }
    : normalizedMemory
      ? {
          enabled: true,
          initialEntries: normalizedMemory.initialEntries,
          initialIndex: normalizedMemory.initialIndex,
          basename: _basename,
        }
      : { enabled: false };

  const { unstable_getBlockNavState: getBlockNavState } = runtimeContext;
  // Keep the define expression inline at every RSC branch. Rspack can then
  // remove the RSC imports in both production and development compilations.
  const rscPayload =
    process.env.MODERN_ENABLE_RSC && props?.rscPayload
      ? safeUse(props.rscPayload)
      : null;

  let hydrationData =
    scope?.hydrationData ||
    (process.env.MODERN_ENABLE_RSC ? rscPayload : undefined);

  const createRouter = () => {
    if (scope?.router)
      return { router: scope.router, routes: scope.routes || [], memoryState };
    if (hydrationData?.errors) {
      hydrationData = {
        ...hydrationData,
        errors: deserializeErrors(hydrationData.errors),
      };
    }

    let routes: RouteObject[] | null = null;
    if (process.env.MODERN_ENABLE_RSC && scope?.definition.isRscClient) {
      routes = createRoutes
        ? createRoutes()
        : createRouteObjectsFromConfig({
            routesConfig,
          });
    } else {
      routes = createRoutes
        ? createRoutes()
        : createRoutesFromElements(
            renderRoutes({
              routesConfig,
              props,
            }),
          );
    }

    if (!routes) {
      routes = [];
    }

    const hooks = api.getHooks();

    if (process.env.MODERN_ENABLE_RSC && rscPayload) {
      try {
        const router = createClientRouterFromPayload(
          rscPayload,
          routes,
          _basename,
          {
            manifest: runtimeContext.routeManifest,
            publicPath: runtimeContext.assetBase,
          },
        );

        if (scope) {
          scope.router = router;
          scope.routes = router.routes || [];
        }
        return { router, routes: router.routes || [], memoryState };
      } catch (e) {
        console.error('Failed to create router from RSC payload:', e);
      }
    }

    const topology = options.selected ? scopeTopology(routes) : undefined;
    const modifiedRoutes = hooks.modifyRoutes.call(routes);
    if (topology) assertScopeTopology(modifiedRoutes, topology);

    if (scope) scope.hash = !supportHtml5History;
    const router = scope?.memory
      ? createMemoryRouter(modifiedRoutes, {
          initialEntries: [scope.initialUrl],
          hydrationData,
        })
      : normalizedMemory
        ? createMemoryRouter(modifiedRoutes, {
            basename: _basename,
            initialEntries: normalizedMemory.initialEntries,
            initialIndex: normalizedMemory.initialIndex,
            hydrationData,
          })
        : supportHtml5History
          ? createBrowserRouter(modifiedRoutes, {
              basename: _basename,
              hydrationData,
              window: scope?.getWindow?.(),
            })
          : createHashRouter(modifiedRoutes, {
              basename: _basename,
              hydrationData,
              window: scope?.getWindow?.(),
            });
    if (scope) {
      scope.router = router;
      scope.routes = modifiedRoutes;
    }

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
    scope?.onRouterCreated?.(router);

    return {
      router,
      routes: modifiedRoutes,
      memoryState,
    };
  };
  // Scoped Routers belong to the mount lifecycle. Its cache can be cleared by
  // cleanup and recreated on effect replay without retaining a disposed Router.
  return useMemo(createRouter, [
    routesConfig,
    props,
    _basename,
    hydrationData,
    getBlockNavState,
    scope,
    scope?.router,
    memoryInput,
  ]);
}
