import type { RouteObject } from '@modern-js/runtime-utils/router';
import type { StaticHandlerContext } from '@modern-js/runtime-utils/router';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import { createContext, useContext, useMemo } from 'react';
import { getGlobalInternalRuntimeContext } from '.';
import type { RouteManifest } from '../../router/runtime/types';
import type { SSRServerContext } from '../types';

export interface TRuntimeContext {
  initialData?: Record<string, unknown>;
  isBrowser: boolean;
  routes?: RouteObject[];
  ssrContext?: SSRServerContext;
  [key: string]: unknown;
}

/**
 * InternalRuntimeContext used internally and by plugins
 */
export interface TInternalRuntimeContext extends TRuntimeContext {
  routeManifest?: RouteManifest;
  routerContext?: StaticHandlerContext;
  unstable_getBlockNavState?: () => boolean;
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
): TInternalRuntimeContext => ({
  isBrowser,
  routeManifest:
    routeManifest ||
    (typeof window !== 'undefined' && (window as any)[ROUTE_MANIFEST]),
});

/**
 * @deprecated use use(RuntimeContext) instead
 */
export const useRuntimeContext = (): TRuntimeContext => {
  return useContext(RuntimeContext);
};
