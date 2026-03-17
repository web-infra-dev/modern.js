import {
  ElementsContext,
  createFromReadableStream,
} from '@modern-js/render/client';
import {
  type DataStrategyMatch,
  type DataStrategyResult,
  type RouteObject,
  type RouterState,
  type StaticHandlerContext,
  StaticRouterProvider,
  createBrowserRouter,
  createStaticRouter,
  redirect,
} from '@modern-js/runtime-utils/router';
import React from 'react';
import type { PayloadRoute, ServerPayload } from '../../core/context';
import { CSSLinks } from './CSSLinks';
import type {
  LazyComponentDescriptor,
  ModernRouteObject,
  RouteManifest,
} from './types';

declare global {
  interface Window {
    _MODERNJS_ROUTE_MANIFEST?: RouteManifest;
    __webpack_public_path__?: string;
  }
}

// There is no `use` method in the following version of react19.
// In order to avoid errors, it is compatible here.
// React.use works on both Promises and Contexts, return type depends on runtime input.
const safeUse = (value: unknown): unknown => {
  const reactUse = (React as Record<string, unknown>).use;
  if (typeof reactUse === 'function') {
    return reactUse(value);
  }
  return null;
};

/**
 * Collect CSS files from matched routes
 */
function collectCssFilesFromRoutes(
  matches: StaticHandlerContext['matches'],
  routes: RouteObject[],
): string[] {
  const cssFiles: string[] = [];

  for (const match of matches) {
    // Use findRouteInTree to recursively find nested routes
    const route = findRouteInTree(
      routes,
      match.route.id,
    ) as ModernRouteObject | null;
    if (!route) continue;

    // Try to get entryCssFiles from Component property
    const component = route.Component as
      | (React.ComponentType & { entryCssFiles?: string[] })
      | undefined;
    if (
      component &&
      typeof component === 'function' &&
      'entryCssFiles' in component
    ) {
      const css = component.entryCssFiles;
      if (Array.isArray(css)) {
        cssFiles.push(...css);
      }
    }
  }

  // Remove duplicates and return
  return Array.from(new Set(cssFiles));
}

export const createServerPayload = (
  routerContext: StaticHandlerContext,
  routes: RouteObject[],
): ServerPayload => {
  const cssFiles = collectCssFilesFromRoutes(routerContext.matches, routes);

  // Find the deepest non-client-component route for CSS injection.
  // Client component routes have their element replaced with Component during
  // hydration, so injecting CSSLinks there causes a hydration mismatch.
  let cssInjectionIndex = -1;
  if (cssFiles.length > 0) {
    for (let i = routerContext.matches.length - 1; i >= 0; i--) {
      const matchRoute = findRouteInTree(
        routes,
        routerContext.matches[i].route.id,
      ) as ModernRouteObject | null;
      if (matchRoute && !matchRoute.isClientComponent) {
        cssInjectionIndex = i;
        break;
      }
    }
    // Fallback to leaf route if all routes are client components
    if (cssInjectionIndex === -1) {
      cssInjectionIndex = routerContext.matches.length - 1;
    }
  }

  return {
    type: 'render' as const,
    actionData: routerContext.actionData,
    errors: routerContext.errors,
    loaderData: routerContext.loaderData,
    location: routerContext.location,
    routes: routerContext.matches.map((match, index: number, matches) => {
      const route = match.route as ModernRouteObject;
      const element = route.element;
      const parentMatch = index > 0 ? matches[index - 1] : undefined;

      let processedElement;

      if (element) {
        const ElementComponent = (element as React.ReactElement).type;
        const elementProps = {
          loaderData: routerContext?.loaderData?.[route.id!],
          actionData: routerContext?.actionData?.[route.id!],
          params: match.params,
          matches: routerContext.matches.map(m => ({
            id: m.route.id,
            pathname: m.pathname,
            params: m.params,
            data: routerContext?.loaderData?.[m.route.id!],
            handle: m.route.handle,
          })),
        };

        const routeElement = React.createElement(
          ElementComponent,
          elementProps,
        );

        if (index === cssInjectionIndex) {
          processedElement = React.createElement(
            React.Fragment,
            null,
            React.createElement(CSSLinks, { cssFiles }),
            routeElement,
          );
        } else {
          processedElement = routeElement;
        }
      }

      return {
        element: processedElement,
        errorElement: route.errorElement,
        handle: route.handle,
        hasAction: !!route.action,
        hasErrorBoundary: !!route.hasErrorBoundary,
        hasLoader: !!route.loader,
        hasClientLoader: !!route.hasClientLoader,
        id: route.id!,
        index: route.index,
        params: match.params,
        parentId: parentMatch?.route.id || route.parentId,
        path: route.path,
        pathname: match.pathname,
        pathnameBase: match.pathnameBase,
      } as PayloadRoute;
    }),
  };
};

export const handleRSCRedirect = (
  headers: Headers,
  basename: string,
  status: number,
): Response => {
  const newHeaders = new Headers(headers);
  let redirectUrl = headers.get('Location')!;

  if (basename !== '/') {
    redirectUrl = redirectUrl.replace(basename, '');
  }

  newHeaders.set('X-Modernjs-Redirect', redirectUrl);
  newHeaders.set('X-Modernjs-BaseUrl', basename);
  newHeaders.delete('Location');

  return new Response(null, {
    status: status,
    headers: newHeaders,
  });
};

export const prepareRSCRoutes = async (
  routes: RouteObject[],
): Promise<void> => {
  const isLazyComponent = (
    component: unknown,
  ): component is LazyComponentDescriptor => {
    return (
      component != null &&
      typeof component === 'object' &&
      '_init' in component &&
      '_payload' in component
    );
  };

  const processRoutes = async (routesList: RouteObject[]): Promise<void> => {
    await Promise.all(
      routesList.map(async (route: RouteObject) => {
        const modernRoute = route as ModernRouteObject;
        if (
          'lazyImport' in modernRoute &&
          isLazyComponent(modernRoute.component)
        ) {
          modernRoute.component = (await modernRoute.lazyImport!()).default;
        }

        if (route.children && Array.isArray(route.children)) {
          await processRoutes(route.children);
        }
      }),
    );
  };

  await processRoutes(routes);
};

interface MergedRoute extends Omit<PayloadRoute, 'children' | 'index'> {
  loader?: RouteObject['loader'];
  isClientComponent?: boolean;
  Component?: React.ComponentType;
  index?: boolean;
  children?: MergedRoute[];
}

const mergeRoutes = (
  routes: PayloadRoute[],
  originalRoutes: RouteObject[] | undefined,
): RouteObject[] => {
  if (!originalRoutes || !Array.isArray(originalRoutes)) {
    return routes;
  }
  const routesMap = new Map<string, PayloadRoute>();

  const buildRoutesMap = (routesList: PayloadRoute[]) => {
    routesList.forEach(route => {
      if (route.id) {
        routesMap.set(route.id, route);
      }

      if (
        'children' in route &&
        route.children &&
        Array.isArray(route.children)
      ) {
        buildRoutesMap(route.children as PayloadRoute[]);
      }
    });
  };

  buildRoutesMap(routes);

  const mergeRoutesRecursive = (origRoutes: RouteObject[]): RouteObject[] => {
    return origRoutes.map(origRoute => {
      const modernOrig = origRoute as ModernRouteObject;
      if (modernOrig.id && routesMap.has(modernOrig.id)) {
        const matchedRoute = routesMap.get(modernOrig.id)!;

        const result: MergedRoute = {
          loader: modernOrig.hasClientLoader ? modernOrig.loader : undefined,
          ...matchedRoute,
        };

        if (modernOrig.isClientComponent) {
          result.isClientComponent = true;
          // Keep element from the server payload for correct hydration.
          // The element already contains the right props (loaderData, etc.)
          // that the Component wouldn't receive from React Router.
        }

        if (origRoute.children && Array.isArray(origRoute.children)) {
          result.children = mergeRoutesRecursive(
            origRoute.children,
          ) as unknown as MergedRoute[];
        }

        return result as unknown as RouteObject;
      }

      return origRoute;
    });
  };

  return mergeRoutesRecursive(originalRoutes);
};

const findRouteInTree = (
  routes: RouteObject[],
  routeId: string,
): RouteObject | null => {
  for (const route of routes) {
    if (route.id === routeId) {
      return route;
    }
    if (route.children && Array.isArray(route.children)) {
      const found = findRouteInTree(route.children, routeId);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

/**
 * Find route segments that changed between the current router state and
 * the new navigation matches. A segment is "changed" if it's newly matched
 * or its params differ from the current match.
 */
function getChangedMatches(
  matches: DataStrategyMatch[],
  currentMatches: RouterState['matches'],
): DataStrategyMatch[] {
  const currentById = new Map<string, RouterState['matches'][number]>();
  for (const m of currentMatches) {
    if (m.route?.id) {
      currentById.set(m.route.id, m);
    }
  }

  return matches.filter(match => {
    const current = currentById.get(match.route?.id);
    return (
      !current ||
      JSON.stringify(current.params) !== JSON.stringify(match.params)
    );
  });
}

/**
 * Check if navigation can skip RSC fetch: all changed route segments must be
 * client-only components with no server-side loaders.
 */
function canSkipRscFetch(
  matches: DataStrategyMatch[],
  routerState: RouterState,
): boolean {
  const changedMatches = getChangedMatches(matches, routerState?.matches || []);
  return (
    changedMatches.length > 0 &&
    changedMatches.every(m => {
      const route = m.route as ModernRouteObject;
      return (
        route.isClientComponent && !(route.hasLoader && !route.hasClientLoader)
      );
    })
  );
}

/**
 * Inject CSS for a route using routeManifest.routeAssets.
 */
function injectRouteCss(routeId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const cssAssets =
    window._MODERNJS_ROUTE_MANIFEST?.routeAssets?.[routeId]?.referenceCssAssets;
  if (!cssAssets) {
    return;
  }
  const publicPath = window.__webpack_public_path__ || '/';
  for (const css of cssAssets) {
    const href =
      css.startsWith('http') || css.startsWith('/') ? css : publicPath + css;
    if (!document.querySelector(`link[href="${CSS.escape(href)}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }
}

/**
 * Restore Component on a route from originalRoutes if it was overwritten
 * by a previous patchRoutes call during RSC navigation.
 */
function ensureClientComponent(
  route: ModernRouteObject,
  originalRoutes: RouteObject[],
): void {
  if (route.isClientComponent && !route.Component) {
    const origRoute = findRouteInTree(
      originalRoutes,
      route.id!,
    ) as ModernRouteObject | null;
    if (origRoute?.Component) {
      route.Component = origRoute.Component as React.ComponentType;
      // Remove element to avoid React Router conflict:
      // "You should not include both `Component` and `element` on your route"
      delete route.element;
    }
  }
}

/**
 * Run client loaders for matches that have them, restoring the loader
 * reference from originalRoutes before resolving.
 */
function resolveClientLoaders(
  matches: DataStrategyMatch[],
  originalRoutes: RouteObject[],
): Promise<{ routeId: string; result: DataStrategyResult }[]> {
  const clientMatches = matches.filter(
    m => (m.route as ModernRouteObject).hasClientLoader,
  );
  if (clientMatches.length === 0) {
    return Promise.resolve([]);
  }
  return Promise.all(
    clientMatches.map(async clientMatch => {
      const origRoute = findRouteInTree(originalRoutes, clientMatch.route.id);
      clientMatch.route.loader = origRoute?.loader;
      const result = await clientMatch.resolve();
      return { routeId: clientMatch.route.id, result };
    }),
  );
}

function applyLoaderResults(
  results: Record<string, DataStrategyResult>,
  loaderResults: { routeId: string; result: DataStrategyResult }[],
): void {
  for (const { routeId, result } of loaderResults) {
    results[routeId] = result;
  }
}

/**
 * Handle navigation for client-only route segments:
 * skip RSC fetch, run client loaders, and inject CSS.
 */
async function resolveClientOnlyNavigation(
  matches: DataStrategyMatch[],
  results: Record<string, DataStrategyResult>,
  originalRoutes: RouteObject[],
  routerState: RouterState,
): Promise<Record<string, DataStrategyResult>> {
  // Only touch changed route segments. Unchanged parent routes may still
  // hold a server-rendered element with loaderData props that must not be
  // replaced with a bare Component.
  const changedMatches = getChangedMatches(matches, routerState?.matches || []);
  for (const match of changedMatches) {
    ensureClientComponent(match.route as ModernRouteObject, originalRoutes);
  }

  applyLoaderResults(
    results,
    await resolveClientLoaders(changedMatches, originalRoutes),
  );

  for (const match of changedMatches) {
    if (match.route.id) {
      injectRouteCss(match.route.id);
    }
  }

  return results;
}

export const createClientRouterFromPayload = (
  payload: ServerPayload,
  originalRoutes: RouteObject[],
  basename = '',
) => {
  const processedRoutes = payload.routes.reduceRight<PayloadRoute[]>(
    (previous, route) => {
      if (previous.length > 0) {
        return [
          {
            ...route,
            children: previous,
          },
        ];
      }
      return [route];
    },
    [],
  );

  const mergedRoutes = mergeRoutes(processedRoutes, originalRoutes);

  const router = createBrowserRouter(mergedRoutes, {
    //@ts-ignore
    hydrationData: payload,
    basename: basename,
    dataStrategy: async ({ request, matches }) => {
      const results: Record<string, DataStrategyResult> = {};

      if (canSkipRscFetch(matches, router.state)) {
        return resolveClientOnlyNavigation(
          matches,
          results,
          originalRoutes,
          router.state,
        );
      }

      const fetchPromise = fetch(request.url, {
        headers: {
          'x-rsc-tree': 'true',
        },
      });

      const clientLoadersPromise = resolveClientLoaders(
        matches,
        originalRoutes,
      );

      const res = await fetchPromise;

      const redirectLocation = res.headers.get('X-Modernjs-Redirect');

      if (redirectLocation) {
        matches.forEach(match => {
          const routeId = match.route.id;
          if (routeId) {
            results[routeId] = {
              type: 'data',
              result: redirect(redirectLocation),
            } as DataStrategyResult;
          }
        });

        return results;
      }

      applyLoaderResults(results, await clientLoadersPromise);

      if (!res.body) {
        throw new Error('Response body is null');
      }

      const payload = await createFromReadableStream(res.body);

      if (
        typeof payload !== 'object' ||
        payload === null ||
        typeof (payload as Record<string, unknown>).type === 'undefined' ||
        (payload as Record<string, unknown>).type !== 'render'
      ) {
        throw new Error('Unexpected payload type');
      }

      const serverPayload = payload as unknown as ServerPayload;

      matches.forEach(match => {
        const routeId = match.route.id;
        const matchedRoute = serverPayload.routes.find(
          (route: PayloadRoute) => route.id === routeId,
        );
        if (matchedRoute) {
          const modernMatch = match.route as ModernRouteObject;
          // @ts-ignore
          router.patchRoutes(
            matchedRoute.parentId ?? null,
            [matchedRoute as unknown as RouteObject],
            true,
          );
          // patchRoutes uses Object.assign and only updates element/errorElement/
          // hydrateFallbackElement. If a previous client-only navigation set
          // Component via ensureClientComponent, it lingers on the route object.
          // React Router renders Component over element when both exist, which
          // would lose the loaderData props from the server element.
          if (modernMatch.isClientComponent && modernMatch.Component) {
            delete modernMatch.Component;
          }
        }
        if (serverPayload.loaderData && routeId in serverPayload.loaderData) {
          results[routeId] = {
            type: 'data',
            result: serverPayload.loaderData[routeId],
          };
        }
      });

      return results;
    },
  });
  return router;
};

interface RSCStaticRouterProps {
  basename?: string;
  useJsonScript?: boolean;
}

const createRSCStaticRouterComponent = (
  payload: ServerPayload,
  basename?: string,
) => {
  const routerContext = {
    actionData: payload.actionData,
    actionHeaders: {},
    activeDeferreds: {},
    basename: basename || '',
    errors: payload.errors,
    loaderData: payload.loaderData,
    loaderHeaders: {},
    location: payload.location,
    statusCode: 200,
    matches: payload.routes.map(match => ({
      params: match.params,
      pathname: match.pathname,
      pathnameBase: match.pathnameBase,
      route: {
        id: match.id,
        action: match.hasAction || !!match.clientAction,
        handle: match.handle,
        hasErrorBoundary: match.hasErrorBoundary,
        loader: match.hasLoader || !!match.clientLoader,
        index: match.index,
        path: match.path,
        shouldRevalidate: match.shouldRevalidate,
      },
    })),
  };

  const processedRoutes = payload.routes.reduceRight<PayloadRoute[]>(
    (previous, route) => {
      if (previous.length > 0) {
        return [
          {
            ...route,
            children: previous,
          },
        ];
      }
      return [route];
    },
    [],
  );

  const router = createStaticRouter(processedRoutes, routerContext);

  return (
    <StaticRouterProvider
      context={routerContext}
      router={router}
      hydrate={false}
    />
  );
};

export const RSCStaticRouter: React.FC<RSCStaticRouterProps> = ({
  basename,
}) => {
  const payload = safeUse(safeUse(ElementsContext)) as ServerPayload;

  if (!payload || payload.type !== 'render') {
    return null;
  }

  return <>{createRSCStaticRouterComponent(payload, basename)}</>;
};
