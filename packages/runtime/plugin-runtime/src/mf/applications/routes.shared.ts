import type {
  LoaderFunctionArgs,
  RouteObject,
} from '@modern-js/runtime-utils/router';
import {
  DYNAMIC_ROUTE_SYMBOL,
  type ApplicationsService,
  type RemoteRoute,
} from './types';

const WRAPPED_LOADER_SYMBOL = Symbol.for(
  'modern-js.mf.applications.wrapped-loader',
);

function isCatchAllRoute(route: RouteObject): boolean {
  const path = route.path?.trim();
  return path === '*' || path === '/*';
}

function isDynamicRoute(route: RouteObject): boolean {
  return Boolean((route as Record<symbol, unknown>)[DYNAMIC_ROUTE_SYMBOL]);
}

function cloneStaticTree(routes: RouteObject[]): RouteObject[] {
  return routes
    .filter(route => !isDynamicRoute(route))
    .map(route => {
      if (route.index) {
        return { ...route };
      }
      return {
        ...route,
        ...(route.children
          ? { children: cloneStaticTree(route.children) }
          : {}),
      };
    });
}

function findRootLayout(routes: RouteObject[]): RouteObject | undefined {
  let candidate: RouteObject | undefined;
  for (const route of routes) {
    if (isDynamicRoute(route) || isCatchAllRoute(route) || route.index) {
      continue;
    }
    if (
      Array.isArray(route.children) ||
      !route.path ||
      route.path === '/' ||
      route.id?.endsWith('_layout') ||
      route.id?.endsWith('layout')
    ) {
      candidate = route;
      break;
    }
  }
  // For scoped apps (e.g. createRoot({ route: '/weather-application' })), the
  // outer root layout may simply wrap a single root-level layout child.
  // Descend so dynamic child routes render inside the scoped app's layout Outlet.
  while (
    candidate &&
    Array.isArray(candidate.children) &&
    candidate.children.length === 1
  ) {
    const onlyChild = candidate.children[0];
    if (
      !onlyChild ||
      onlyChild.index ||
      isDynamicRoute(onlyChild) ||
      isCatchAllRoute(onlyChild) ||
      !Array.isArray(onlyChild.children) ||
      (onlyChild.path && onlyChild.path !== '/')
    ) {
      break;
    }
    candidate = onlyChild;
  }
  return candidate;
}

/**
 * Merge dynamic routes into a clean static base tree while preserving priority:
 * exact static routes > dynamic mounted routes > local catch-all (*) routes.
 */
export function mergeDynamicRoutes(
  baseRoutes: RouteObject[],
  dynamicRoutes: RouteObject[],
): RouteObject[] {
  const cloned = cloneStaticTree(baseRoutes);
  if (!dynamicRoutes.length) {
    return cloned;
  }

  const rootLayout = findRootLayout(cloned);
  if (rootLayout && !rootLayout.index) {
    const existingChildren = Array.isArray(rootLayout.children)
      ? rootLayout.children
      : [];
    const exactStatic: RouteObject[] = [];
    const catchAllStatic: RouteObject[] = [];
    for (const child of existingChildren) {
      if (isCatchAllRoute(child)) catchAllStatic.push(child);
      else exactStatic.push(child);
    }
    rootLayout.children = [...exactStatic, ...dynamicRoutes, ...catchAllStatic];
    return cloned;
  }

  const exactStatic: RouteObject[] = [];
  const catchAllStatic: RouteObject[] = [];
  for (const route of cloned) {
    if (isCatchAllRoute(route)) catchAllStatic.push(route);
    else exactStatic.push(route);
  }
  return [...exactStatic, ...dynamicRoutes, ...catchAllStatic];
}

/**
 * Attach `context.applications` to every route loader without clobbering
 * existing server RequestContext (`get`/`set`) properties.
 */
export function injectApplicationsIntoLoaders(
  routes: RouteObject[],
  service: ApplicationsService,
): RouteObject[] {
  for (const route of routes) {
    if (typeof route.loader === 'function') {
      const original = route.loader as ((
        args: LoaderFunctionArgs,
      ) => unknown) & {
        [WRAPPED_LOADER_SYMBOL]?: boolean;
      };
      if (!original[WRAPPED_LOADER_SYMBOL]) {
        const wrapped = (args: LoaderFunctionArgs) => {
          const baseContext = args.context;
          const nextContext =
            baseContext && typeof baseContext === 'object'
              ? Object.assign(baseContext, { applications: service })
              : { applications: service };
          return original({
            ...args,
            context: nextContext as LoaderFunctionArgs['context'],
          });
        };
        (wrapped as unknown as Record<symbol, unknown>)[WRAPPED_LOADER_SYMBOL] =
          true;
        route.loader = wrapped;
      }
    }
    if (Array.isArray(route.children) && route.children.length > 0) {
      injectApplicationsIntoLoaders(route.children, service);
    }
  }
  return routes;
}

export function tagDynamicRoute(route: RouteObject): RouteObject {
  // Keep enumerable so downstream modifyRoutes hooks using `{ ...route }`
  // preserve the symbol tag across shallow clones (Symbols remain omitted from
  // Object.keys and JSON.stringify).
  Object.defineProperty(route, DYNAMIC_ROUTE_SYMBOL, {
    value: true,
    enumerable: true,
    configurable: true,
  });
  return route;
}

export type DynamicRouteBuilder = (
  routes: readonly RemoteRoute[],
  parentMountId: string,
  parentBasename: string,
) => RouteObject[];
