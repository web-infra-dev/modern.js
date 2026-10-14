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
  let renderStarted = false;
  let canRetryPreload = false;

  const loadOnce = () => {
    promise ??= loadModule().catch((error: unknown) => {
      canRetryPreload = isChunkLoadError(error);
      throw error;
    });
    return promise;
  };

  return {
    preload() {
      // A later navigation or fetch may retry an unconsumed chunk failure.
      // Keep evaluation errors: re-importing can return incomplete exports.
      if (!renderStarted && canRetryPreload) {
        promise = undefined;
        canRetryPreload = false;
      }
      return loadOnce();
    },
    load() {
      // React must receive the current attempt's result, including its error.
      // Once consumed, preserve React.lazy's existing result caching behavior.
      renderStarted = true;
      return loadOnce();
    },
  };
};

export const createLoadableRouteModuleLoader = <T>() => {
  let promise: Promise<T> | undefined;

  return (loadModule: () => Promise<T>): Promise<T> => {
    // Server imports retain loadable's synchronous loading and request behavior.
    if (typeof document === 'undefined') {
      return loadModule();
    }
    promise ??= loadModule().catch((error: unknown) => {
      // Loadable may retry a failed request when rendering or loading again.
      // Keep evaluation failures so every retry still receives the real error.
      if (isChunkLoadError(error)) {
        promise = undefined;
      }
      throw error;
    });
    return promise;
  };
};

function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  try {
    return (
      'request' in error &&
      typeof error.request === 'string' &&
      (('name' in error && error.name === 'ChunkLoadError') ||
        ('code' in error && error.code === 'CSS_CHUNK_LOAD_FAILED'))
    );
  } catch {
    // Inspecting an arbitrary rejection must not replace the original error.
    return false;
  }
}
