import type { ShouldRevalidateFunction } from '@modern-js/runtime-utils/router';
import { ROUTE_MODULES } from '@modern-js/utils/universal/constants';

export const createShouldRevalidate = (
  routeId: string,
  moduleCache?: Record<string, unknown>,
): ShouldRevalidateFunction => {
  return arg => {
    const routeModule = (
      moduleCache
        ? moduleCache[routeId]
        : window?.[ROUTE_MODULES as keyof Window]?.[routeId]
    ) as { shouldRevalidate?: ShouldRevalidateFunction } | undefined;
    if (routeModule && typeof routeModule.shouldRevalidate === 'function') {
      return routeModule.shouldRevalidate(arg);
    }

    return arg.defaultShouldRevalidate;
  };
};

export const handleRouteModule = <T>(
  routeModule: T,
  routeId: string,
  moduleCache?: Record<string, unknown>,
) => {
  if (moduleCache) moduleCache[routeId] = routeModule;
  else if (typeof document !== 'undefined') {
    (window as any)[ROUTE_MODULES][routeId] = routeModule;
  }
  return routeModule;
};

/**
 * @deprecated Generated routes no longer use this. Swallowing the import error
 * here replaced a `ChunkLoadError` with an unrelated `TypeError` by the time it
 * reached the route error boundary. Kept only for code that imports it directly.
 */
export const handleRouteModuleError = (error: Error) => {
  console.error(error);
  return null;
};
