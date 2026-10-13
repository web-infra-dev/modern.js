import type Module from 'module';
import type { ShouldRevalidateFunction } from '@modern-js/runtime-utils/router';
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

export const handleRouteModuleError = (error: unknown): never => {
  console.error(error);
  throw error;
};

export const createRouteModuleLoader = <T>(loadModule: () => Promise<T>) => {
  let promise: Promise<T> | undefined;
  // Preloading and React.lazy must observe the same result, including failures.
  // Re-importing a failed module can return incomplete exports from the bundler.
  return () => (promise ??= loadModule());
};
