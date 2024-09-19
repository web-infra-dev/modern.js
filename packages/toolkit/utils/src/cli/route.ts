import type { NestedRouteForCli, PageRoute } from '@modern-js/types';
import { lodash } from '../compiled';

const { cloneDeep } = lodash;

export function filterRoutesForServer(
  routes: (NestedRouteForCli | PageRoute)[],
) {
  const clonedRoutes = cloneDeep(routes);
  const newRoutes = clonedRoutes
    .map(route => {
      if (route.type !== 'nested') {
        return route;
      }
      if (route.children && route.children.length > 0) {
        route.children = filterRoutesForServer(
          route.children,
        ) as NestedRouteForCli[];
      }

      if (route.inValidSSRRoute) {
        return null;
      }

      return route;
    })
    .filter(route => route !== null);

  return newRoutes as (NestedRouteForCli | PageRoute)[];
}

export function filterRoutesLoader(routes: (NestedRouteForCli | PageRoute)[]) {
  const clonedRoutes = cloneDeep(routes);
  const newRoutes = clonedRoutes
    .map(route => {
      if (route.type !== 'nested') {
        return route;
      }
      if (route.children && route.children.length > 0) {
        route.children = filterRoutesLoader(
          route.children,
        ) as NestedRouteForCli[];
      }

      if (route.inValidSSRRoute) {
        delete route.loader;
        delete route.data;
        delete route.action;
      }

      return route;
    })
    .filter(route => route !== null);

  return newRoutes;
}

export function markRoutes(
  routes: (NestedRouteForCli | PageRoute)[],
  routeIds: string[],
): (NestedRouteForCli | PageRoute)[] {
  return routes.map(route => {
    if (route.type !== 'nested') {
      return route;
    }

    if (route.children && route.children.length > 0) {
      route.children = markRoutes(
        route.children,
        routeIds,
      ) as NestedRouteForCli[];
    }

    if (route.children && route.children.length > 0) {
      route.inValidSSRRoute = route.children.every(
        child => child.inValidSSRRoute ?? false,
      );
    } else if (route.id) {
      route.inValidSSRRoute = !routeIds.includes(route.id);
    }

    return route;
  });
}
