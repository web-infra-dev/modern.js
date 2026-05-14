import type {
  RouteObject,
  StaticHandlerContext,
} from '@modern-js/runtime-utils/router';
import type { BaseSSRServerContext } from '@modern-js/types';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import { createContext, useContext } from 'react';
import type {
  InternalRouterRuntimeState,
  InternalRouterServerSnapshot,
  RouteManifest,
  RouterFramework,
} from '../../router/runtime/types';
import type { RequestContext, SSRServerContext } from '../types';

export interface TRuntimeContext {
  initialData?: Record<string, unknown>;
  isBrowser: boolean;
  routes?: RouteObject[];
  routerFramework?: RouterFramework;
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
  routeManifest?: RouteManifest;
  routerRuntime?: InternalRouterRuntimeState;
  routerInstance?: unknown;
  routerHydrationScript?: string;
  routerMatchedRouteIds?: string[];
  routerServerSnapshot?: InternalRouterServerSnapshot;
  routerContext?: StaticHandlerContext;
  /**
   * @deprecated Use `routerInstance` or `routerRuntime.instance` instead.
   */
  tanstackRouter?: unknown;
  /**
   * @deprecated Use `routerServerSnapshot.hydrationScript(s)` instead.
   */
  tanstackSsrScript?: string;
  /**
   * @deprecated Use `routerServerSnapshot.matchedRouteIds` instead.
   */
  tanstackMatchedModernRouteIds?: string[];
  unstable_getBlockNavState?: () => boolean;
  ssrContext?: SSRServerContext;
  _internalContext?: any;
  _internalRouterBaseName?: any;
}

export const InternalRuntimeContext = createContext<TInternalRuntimeContext>(
  {} as any,
);

export const RuntimeContext = createContext<TRuntimeContext>({} as any);

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
