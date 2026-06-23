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

interface RouteComponentErrorReporterProps {
  routeId: string;
  children?: React.ReactNode;
}

const reportedRouteComponentRenderErrors = new Set<string>();

const getRouteComponentRenderErrorKey = (routeId: string, error: unknown) => {
  if (error instanceof Error) {
    return `${routeId}:${error.name}:${error.message}`;
  }

  return `${routeId}:${String(error)}`;
};

const shouldReportRouteComponentRenderError = (
  routeId: string,
  error: unknown,
) => {
  const key = getRouteComponentRenderErrorKey(routeId, error);
  if (reportedRouteComponentRenderErrors.has(key)) {
    return false;
  }

  reportedRouteComponentRenderErrors.add(key);
  setTimeout(() => {
    reportedRouteComponentRenderErrors.delete(key);
  }, 1000);
  return true;
};

class RouteComponentErrorReporter extends React.Component<RouteComponentErrorReporterProps> {
  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    if (shouldReportRouteComponentRenderError(this.props.routeId, error)) {
      emitRouteComponent({
        type: 'render-error',
        routeId: this.props.routeId,
        error,
        ...(errorInfo.componentStack
          ? { componentStack: errorInfo.componentStack }
          : {}),
      });
    }
    throw error;
  }

  render() {
    return this.props.children ?? null;
  }
}

interface RouteComponentMountReporterProps {
  routeId: string;
}

const RouteComponentMountReporter = ({
  routeId,
}: RouteComponentMountReporterProps) => {
  React.useEffect(() => {
    emitRouteComponent({
      type: 'mount',
      routeId,
    });
  }, [routeId]);

  return null;
};

export const createRouteComponent = <
  Props extends {},
  T extends React.ComponentType<Props>,
>(
  routeId: string,
  Component: T,
): T => {
  const RouteComponent = (props: Props) => {
    return React.createElement(
      RouteComponentErrorReporter,
      { routeId },
      React.createElement(
        React.Fragment,
        null,
        React.createElement<Props>(Component, props),
        React.createElement(RouteComponentMountReporter, { routeId }),
      ),
    );
  };

  RouteComponent.displayName =
    Component.displayName || Component.name
      ? `ModernRouteComponent(${Component.displayName || Component.name})`
      : `ModernRouteComponent(${routeId})`;

  return RouteComponent as unknown as T;
};
