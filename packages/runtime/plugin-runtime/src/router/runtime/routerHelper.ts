import type Module from 'module';
import type { ShouldRevalidateFunction } from '@modern-js/runtime-utils/router';
import { ROUTE_MODULES } from '@modern-js/utils/universal/constants';
import * as React from 'react';
import { getGlobalInternalRuntimeContext } from '../../core/context';
import type {
  RouteComponentEvent,
  RouteLoaderEvent,
  RouterExtendsHooks,
} from './hooks';

const getRouterHooks = () => {
  try {
    return getGlobalInternalRuntimeContext()
      ?.hooks as Partial<RouterExtendsHooks>;
  } catch {
    return undefined;
  }
};

const emitRouteLoader = (event: RouteLoaderEvent) => {
  getRouterHooks()?.onRouteLoader?.call(event);
};

const emitRouteComponent = (event: RouteComponentEvent) => {
  getRouterHooks()?.onRouteComponent?.call(event);
};

const isRedirectResponse = (value: unknown): value is Response => {
  return (
    typeof Response !== 'undefined' &&
    value instanceof Response &&
    value.status >= 300 &&
    value.status < 400
  );
};

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
  emitRouteComponent({
    type: 'module-load',
    routeId,
    routeModule,
  });
  return routeModule;
};

export const handleRouteModuleError = (error: Error, routeId?: string) => {
  emitRouteComponent({
    type: 'module-load-error',
    routeId,
    error,
  });
  console.error(error);
  return null;
};

export const createRouteLoader = <
  Args,
  Result,
  T extends (args: Args) => Result,
>(
  routeId: string,
  loader: T,
): T => {
  const wrappedLoader = async (args: Args): Promise<Awaited<Result>> => {
    emitRouteLoader({
      type: 'start',
      routeId,
      args,
    });
    try {
      const result = await loader(args);
      emitRouteLoader({
        type: 'success',
        routeId,
        args,
        result,
      });
      return result;
    } catch (error) {
      if (isRedirectResponse(error)) {
        emitRouteLoader({
          type: 'redirect',
          routeId,
          args,
          response: error,
        });
      } else {
        emitRouteLoader({
          type: 'error',
          routeId,
          args,
          error,
        });
      }
      throw error;
    }
  };

  return wrappedLoader as T;
};

export const createRouteComponent = <
  Props extends {},
  T extends React.ComponentType<Props>,
>(
  routeId: string,
  Component: T,
): T => {
  const RouteComponent = (props: Props) => {
    React.useEffect(() => {
      emitRouteComponent({
        type: 'mount',
        routeId,
      });
    }, []);

    return React.createElement<Props>(Component, props);
  };

  RouteComponent.displayName =
    Component.displayName || Component.name
      ? `ModernRouteComponent(${Component.displayName || Component.name})`
      : `ModernRouteComponent(${routeId})`;

  return RouteComponent as unknown as T;
};
