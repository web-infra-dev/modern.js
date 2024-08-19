import type Module from 'module';
import type { ShouldRevalidateFunction } from '@modern-js/runtime-utils/remix-router';
import { ROUTE_MODULES } from '@modern-js/utils/universal/constants';

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
