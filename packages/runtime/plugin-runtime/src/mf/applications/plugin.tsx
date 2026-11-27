import React from 'react';
import type { DataRouter, RouteObject } from '@modern-js/runtime-utils/router';
import { parsedJSONFromElement } from '@modern-js/runtime-utils/parsed';
import type { RuntimePlugin } from '../../core';
import type { RouterExtendsHooks } from '../../router/runtime/hooks';
import { ApplicationsReactContext } from './context';
import {
  getActiveApplicationsStore,
  setActiveApplicationsStore,
} from './registry';
import { createBrowserDynamicRoutesBuilder } from './routes';
import {
  injectApplicationsIntoLoaders,
  mergeDynamicRoutes,
} from './routes.shared';
import { createApplicationsStore, type ApplicationsStore } from './store';
import {
  APPLICATIONS_DATA_SCRIPT_ID,
  type ApplicationsHooksModule,
  type SerializedApplicationsState,
} from './types';

export interface ApplicationsRuntimePluginConfig {
  hooks?: ApplicationsHooksModule;
  autoGenerateRoute?: boolean;
  maxDepth?: number;
  timeoutMs?: number;
}

function readHydratedApplicationsState():
  SerializedApplicationsState | undefined {
  if (typeof window === 'undefined') return undefined;
  const globalState = (
    window as unknown as Record<string, SerializedApplicationsState | undefined>
  )[APPLICATIONS_DATA_SCRIPT_ID];
  if (globalState && globalState.version === 1) {
    return globalState;
  }
  if (typeof document !== 'undefined') {
    const parsed = parsedJSONFromElement(APPLICATIONS_DATA_SCRIPT_ID) as
      SerializedApplicationsState | undefined;
    if (parsed && parsed.version === 1) {
      return parsed;
    }
  }
  return undefined;
}

function attachRouterIntegration(
  api: any,
  store: ApplicationsStore,
  mountId: string,
  autoGenerateRoute: boolean,
) {
  const buildDynamicRoutes = createBrowserDynamicRoutesBuilder(store);
  let baseRoutes: RouteObject[] | undefined;
  let activeRouter: DataRouter | undefined;

  const computeMergedRoutes = (routes: RouteObject[]): RouteObject[] => {
    const dynamicRoutes = autoGenerateRoute
      ? buildDynamicRoutes(store.getRoutesForMount(mountId), mountId)
      : [];
    const merged = mergeDynamicRoutes(routes, dynamicRoutes);
    return injectApplicationsIntoLoaders(merged, store.service);
  };

  const syncRouterRoutes = () => {
    if (!activeRouter || !baseRoutes) return;
    const nextRoutes = computeMergedRoutes(baseRoutes);
    const internalRouter = activeRouter as DataRouter & {
      _internalSetRoutes?: (routes: RouteObject[]) => void;
    };
    if (typeof internalRouter._internalSetRoutes === 'function') {
      internalRouter._internalSetRoutes(nextRoutes);
    }
    const context = api.getRuntimeContext();
    if (context.application) {
      context.application.routes = nextRoutes;
    }
  };

  api.modifyRoutes((routes: RouteObject[]) => {
    baseRoutes = routes;
    return computeMergedRoutes(routes);
  });

  const unsubscribe = store.subscribe(touchedMounts => {
    if (touchedMounts.includes(mountId)) {
      syncRouterRoutes();
    }
  });
  api.onDispose(unsubscribe);

  api.onBeforeRender((context: any) => {
    const scope = context.application;
    if (!scope) return;

    const prevOnRouterCreated = scope.onRouterCreated;
    scope.onRouterCreated = (router: DataRouter) => {
      activeRouter = router;
      prevOnRouterCreated?.(router);
    };

    const prevPatch = scope.patchRoutesOnNavigation;
    scope.patchRoutesOnNavigation = async (args: {
      path: string;
      signal: AbortSignal;
      matches: unknown[];
      patch: (routeId: string | null, children: RouteObject[]) => void;
    }) => {
      if (prevPatch) {
        await prevPatch(args);
      }
      const search =
        typeof window !== 'undefined' ? window.location.search : '';
      await store.discoverApplications({
        pathname: args.path,
        search,
        signal: args.signal,
      });
      syncRouterRoutes();
    };
  });

  api.wrapRoot((App: React.ComponentType<any> | undefined) => {
    return function ApplicationsContextProvider(
      props: Record<string, unknown>,
    ) {
      const content = App ? (
        <App {...props} />
      ) : (
        (props.children as React.ReactNode)
      );
      return (
        <ApplicationsReactContext.Provider value={store.service}>
          {content}
        </ApplicationsReactContext.Provider>
      );
    };
  });
}

/** Root browser runtime plugin registered when `moduleFederation.applications` is enabled. */
export const mfApplicationsPlugin = (
  config: ApplicationsRuntimePluginConfig = {},
): RuntimePlugin<{ extendHooks: RouterExtendsHooks }> => ({
  name: '@modern-js/plugin-mf-applications',
  post: ['@modern-js/plugin-router'],
  setup: api => {
    let store: ApplicationsStore | undefined;
    let ownsStore = false;

    const ensureStore = (context: any): ApplicationsStore | undefined => {
      if (store) return store;
      const isFragment = context.application?.output === 'fragment';
      if (isFragment) {
        const existing = getActiveApplicationsStore();
        if (existing) {
          store = existing;
          return store;
        }
      }
      if (!config.hooks && !isFragment) {
        return undefined;
      }
      const initialUrl = context.application?.initialUrl;
      const parsedInitial = initialUrl
        ? new URL(initialUrl, 'http://localhost')
        : undefined;
      store = createApplicationsStore({
        hooks: config.hooks,
        autoGenerateRoute: config.autoGenerateRoute ?? true,
        isBrowser: true,
        rootBasename: context.application?.basename || '/',
        maxDepth: config.maxDepth,
        timeoutMs: config.timeoutMs,
        getLocation: () =>
          typeof window !== 'undefined'
            ? {
                pathname: window.location.pathname,
                search: window.location.search,
              }
            : {
                pathname: parsedInitial?.pathname || '/',
                search: parsedInitial?.search || '',
              },
      });
      ownsStore = true;
      if (!isFragment) {
        setActiveApplicationsStore(store);
      }
      return store;
    };

    const mountIdOf = (context: any) => context.application?.mountId || 'root';

    const autoGenerateRoute = config.autoGenerateRoute ?? true;
    let buildDynamicRoutes:
      ReturnType<typeof createBrowserDynamicRoutesBuilder> | undefined;
    let baseRoutes: RouteObject[] | undefined;
    let activeRouter: DataRouter | undefined;
    let boundMountId = 'root';
    let unsubscribe: (() => void) | undefined;

    const computeMergedRoutes = (routes: RouteObject[]): RouteObject[] => {
      if (!store) return routes;
      buildDynamicRoutes ||= createBrowserDynamicRoutesBuilder(store);
      const dynamicRoutes = autoGenerateRoute
        ? buildDynamicRoutes(
            store.getRoutesForMount(boundMountId),
            boundMountId,
          )
        : [];
      const merged = mergeDynamicRoutes(routes, dynamicRoutes);
      return injectApplicationsIntoLoaders(merged, store.service);
    };

    const syncRouterRoutes = () => {
      if (!activeRouter || !baseRoutes || !store) return;
      const nextRoutes = computeMergedRoutes(baseRoutes);
      const internalRouter = activeRouter as DataRouter & {
        _internalSetRoutes?: (routes: RouteObject[]) => void;
      };
      if (typeof internalRouter._internalSetRoutes === 'function') {
        internalRouter._internalSetRoutes(nextRoutes);
      }
      const context = api.getRuntimeContext();
      if (context.application) {
        context.application.routes = nextRoutes;
      }
    };

    api.onBeforeRender(async context => {
      const activeStore = ensureStore(context);
      if (!activeStore) return;
      boundMountId = mountIdOf(context);
      context.applications = activeStore.service;

      if (!unsubscribe) {
        unsubscribe = activeStore.subscribe(touched => {
          if (touched.includes(boundMountId)) {
            syncRouterRoutes();
          }
        });
      }

      const scope = context.application;
      if (scope) {
        const prevOnRouterCreated = scope.onRouterCreated;
        scope.onRouterCreated = (router: DataRouter) => {
          activeRouter = router;
          prevOnRouterCreated?.(router);
        };
        const prevPatch = scope.patchRoutesOnNavigation;
        scope.patchRoutesOnNavigation = async args => {
          if (prevPatch) {
            await prevPatch(args);
          }
          const search =
            typeof window !== 'undefined' ? window.location.search : '';
          await activeStore.discoverApplications({
            pathname: args.path,
            search,
            signal: args.signal,
          });
          syncRouterRoutes();
        };
      }

      if (ownsStore) {
        const hydrated = readHydratedApplicationsState();
        if (hydrated) {
          activeStore.hydrate(hydrated);
        } else {
          await activeStore.discoverApplications();
        }
      }
    });

    api.modifyRoutes(routes => {
      baseRoutes = routes;
      return computeMergedRoutes(routes);
    });

    api.wrapRoot(App => {
      return function ApplicationsRootWrapper(props: Record<string, unknown>) {
        const content = App ? (
          <App {...props} />
        ) : (
          (props.children as React.ReactNode)
        );
        if (!store) return content as React.ReactElement;
        return (
          <ApplicationsReactContext.Provider value={store.service}>
            {content}
          </ApplicationsReactContext.Provider>
        );
      };
    });

    api.onDispose(() => {
      unsubscribe?.();
      unsubscribe = undefined;
      if (ownsStore && store) {
        if (getActiveApplicationsStore() === store) {
          setActiveApplicationsStore(undefined);
        }
        store.dispose();
      }
      store = undefined;
    });
  },
});

/**
 * Lightweight child Bridge runtime plugin attached automatically when a host
 * mounts a child Modern application with a discovered `mountId`.
 */
export function createChildApplicationsPlugin(
  mountId: string,
  explicitStore?: ApplicationsStore,
): RuntimePlugin<{ extendHooks: RouterExtendsHooks }> {
  return {
    name: '@modern-js/plugin-mf-applications-child',
    post: ['@modern-js/plugin-router'],
    setup: api => {
      const store = explicitStore ?? getActiveApplicationsStore();
      if (!store) return;
      api.onBeforeRender(context => {
        context.applications = store.service;
      });
      attachRouterIntegration(api, store, mountId, true);
    },
  };
}
