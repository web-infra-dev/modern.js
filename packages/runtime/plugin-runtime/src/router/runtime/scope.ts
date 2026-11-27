import type { RouteObject } from '@modern-js/runtime-utils/router';

const DYNAMIC_ROUTE_SYMBOL = Symbol.for('modern-js.router.dynamic-route');

/** Runtime hooks may decorate selected nodes, but cannot replace their topology. */
export function scopeTopology(routes: RouteObject[], parent = ''): string[] {
  return routes
    .filter(route => !(route as Record<symbol, unknown>)[DYNAMIC_ROUTE_SYMBOL])
    .flatMap(route => {
      const key = `${parent}\0${route.id}\0${route.path || ''}\0${Boolean(route.index)}`;
      return [key, ...scopeTopology(route.children || [], key)];
    })
    .sort();
}

export function assertScopeTopology(routes: RouteObject[], expected: string[]) {
  const actual = scopeTopology(routes);
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    throw new Error(
      'Runtime route hooks cannot add, remove or move routes in a createRoot({ route }) export. Change the build-time route definition instead.',
    );
  }
}
