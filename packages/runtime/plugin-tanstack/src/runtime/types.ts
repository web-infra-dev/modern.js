import type { RequestContext } from '@modern-js/runtime-utils/node';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import type { NestedRoute, PageRoute } from '@modern-js/types';
import type React from 'react';

export type BuiltInRouterFramework = 'react-router' | 'tanstack';
export type RouterFramework = BuiltInRouterFramework | (string & {});

export type RouterConfig = {
  framework?: RouterFramework;
  routesConfig: {
    globalApp?: React.ComponentType<any>;
    routes?: (NestedRoute | PageRoute)[];
  };
  oldVersion?: boolean;
  serverBase?: string[];
  supportHtml5History?: boolean;
  basename?: string;
  createRoutes?: () => RouteObject[];
  future?: Partial<{
    v7_startTransition: boolean;
  }>;
  unstable_reloadOnURLMismatch?: boolean;
};

export interface RouterRouteMatchSnapshot {
  routeId: string;
  assetRouteId?: string;
  pathname?: string;
  params?: Record<string, string>;
}

export interface InternalRouterServerSnapshot {
  framework?: RouterFramework;
  basename?: string;
  statusCode?: number;
  errors?: Record<string, unknown>;
  routerData?: {
    loaderData?: Record<string, unknown>;
    errors?: Record<string, unknown>;
  };
  hydrationScript?: string;
  hydrationScripts?: string[];
  matchedRouteIds?: string[];
  matches?: RouterRouteMatchSnapshot[];
}

export interface InternalRouterRuntimeState {
  framework: RouterFramework;
  basename?: string;
  instance?: unknown;
  hydrationScript?: string;
  hydrationScripts?: string[];
  matchedRouteIds?: string[];
  matches?: RouterRouteMatchSnapshot[];
  serverSnapshot?: InternalRouterServerSnapshot;
  cleanup?: () => void | Promise<void>;
}

export interface RouterServerPrepareResult {
  state: InternalRouterRuntimeState;
  snapshot?: InternalRouterServerSnapshot;
  redirect?: Response;
  cleanup?: () => void | Promise<void>;
}

interface DataFunctionArgs<D = any> {
  request: Request;
  params: Record<string, string>;
  context?: D;
}

export type LoaderFunctionArgs<
  P extends Record<string, unknown> = Record<string, unknown>,
> = DataFunctionArgs<RequestContext<P>>;

type DataFunctionValue = Response | NonNullable<unknown> | null;

export type LoaderFunction = <
  P extends Record<string, unknown> = Record<string, unknown>,
>(
  args: LoaderFunctionArgs<P>,
) => Promise<DataFunctionValue> | DataFunctionValue;
