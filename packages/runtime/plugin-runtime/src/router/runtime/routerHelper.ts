import type Module from 'module';
import type { ShouldRevalidateFunction } from '@modern-js/runtime-utils/router';
import { ROUTE_MODULES } from '@modern-js/utils/universal/constants';

/** One registry per generated route entry, isolated from other applications. */
export const createRouteModuleRegistry = () => {
  const routeModules = new Map<
    string,
    { shouldRevalidate?: ShouldRevalidateFunction }
  >();

  return {
    createShouldRevalidate(routeId: string): ShouldRevalidateFunction {
      return arg => {
        const routeModule = routeModules.get(routeId);
        if (typeof routeModule?.shouldRevalidate === 'function') {
          return routeModule.shouldRevalidate(arg);
        }
        return arg.defaultShouldRevalidate;
      };
    },
    handleRouteModule<T>(routeModule: T, routeId: string): T {
      routeModules.set(
        routeId,
        routeModule as { shouldRevalidate?: ShouldRevalidateFunction },
      );
      return routeModule;
    },
  };
};

// Preserve these helpers for applications built with older generated routes.
export const createShouldRevalidate = (
  routeId: string,
): ShouldRevalidateFunction => {
  return arg => {
    const routeModule = window?.[ROUTE_MODULES as keyof Window]?.[routeId];
    if (routeModule && typeof routeModule.shouldRevalidate === 'function') {
      return routeModule.shouldRevalidate(arg);
    }

    return arg.defaultShouldRevalidate;
  };
};

export const handleRouteModule = (routeModule: Module, routeId: string) => {
  if (typeof document !== 'undefined') {
    (window as any)[ROUTE_MODULES][routeId] = routeModule;
  }
  return routeModule;
};

export const handleRouteModuleError = (error: Error) => {
  console.error(error);
  return null;
};
