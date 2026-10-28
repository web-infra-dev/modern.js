import type { RouteObject } from '@modern-js/runtime-utils/router';
import type { StaticHandlerContext } from '@modern-js/runtime-utils/router';
import type { DataRouter } from '@modern-js/runtime-utils/router';
import type { BaseSSRServerContext } from '@modern-js/types';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import { createContext, useContext } from 'react';
import type { RouteManifest, RouterConfig } from '../../router/runtime/types';
import type { RequestContext, SSRServerContext } from '../types';

export interface TRuntimeContext {
  initialData?: Record<string, unknown>;
  isBrowser: boolean;
  routes?: RouteObject[];
  requestContext: RequestContext;
  /**
   * @deprecated Use `requestContext` instead
   */
  context: RequestContext;
  [key: string]: unknown;
}

/**
 * InternalRuntimeContext used internally and by plugins
 */
export interface TInternalRuntimeContext extends TRuntimeContext {
  _routeScope?: {
    config: RouterConfig['routesConfig'];
    initialUrl: string;
    projectHref?: (href: string) => string;
    router?: DataRouter;
    routes?: RouteObject[];
  };
  routeManifest?: RouteManifest;
  routerContext?: StaticHandlerContext;
  unstable_getBlockNavState?: () => boolean;
  ssrContext?: SSRServerContext;
  _internalContext?: any;
  _internalRouterBaseName?: any;
}

export const InternalRuntimeContext = createContext<TInternalRuntimeContext>(
  {} as any,
);

export const RuntimeContext = createContext<TRuntimeContext>({} as any);
export const ScopedRootPropsContext = createContext<Record<string, unknown>>(
  {},
);

/**
 * deprecated, use RuntimeContext instead
 */
export const ReactRuntimeContext = RuntimeContext;

export const getInitialContext = (
  isBrowser = true,
  routeManifest?: RouteManifest,
): TInternalRuntimeContext => {
  const requestContext = {
    request: {} as BaseSSRServerContext['request'],
    response: {} as BaseSSRServerContext['response'],
  };
  return {
    isBrowser,
    routeManifest:
      routeManifest ||
      (typeof window !== 'undefined' && (window as any)[ROUTE_MANIFEST]),
    requestContext,
    context: requestContext, // deprecated, keep for backward compatibility
  };
};

/**
 * @deprecated use use(RuntimeContext) instead
 */
export const useRuntimeContext = (): TRuntimeContext => {
  return useContext(RuntimeContext);
};
