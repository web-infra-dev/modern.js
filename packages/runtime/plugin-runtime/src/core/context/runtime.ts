import type { StaticHandlerContext } from '@modern-js/runtime-utils/remix-router';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import { createContext } from 'react';
import type { RouteManifest } from '../../router/runtime/types';
import { createLoaderManager } from '../loader/loaderManager';
import type { SSRServerContext, TSSRContext } from '../types';

interface BaseRuntimeContext {
  initialData?: Record<string, unknown>;
  loaderManager: ReturnType<typeof createLoaderManager>;
  isBrowser: boolean;
  // ssr type
  ssrContext?: SSRServerContext;
  routeManifest: RouteManifest;
  routerContext?: StaticHandlerContext;
  context?: TSSRContext;
  /**
   * private
   */
  unstable_getBlockNavState?: () => boolean;
}

// It's the RuntimeContext passed internally
export interface RuntimeContext extends BaseRuntimeContext {
  [key: string]: any;
}

export const RuntimeReactContext = createContext<RuntimeContext>({} as any);

export const ServerRouterContext = createContext({} as any);

// TODO: We should export this context to user as RuntimeContext, use in `init` function
export interface TRuntimeContext {
  initialData?: Record<string, unknown>;
  isBrowser: boolean;
  context: TSSRContext;
  /** @deprecated use context.request field instead */
  request?: SSRServerContext['request'];
  /** @deprecated use context.response field instead */
  response?: SSRServerContext['response'];
  routes?: RouteObject[];
  [key: string]: any;
}

export const getInitialContext = (
  isBrowser = true,
  routeManifest?: RouteManifest,
): RuntimeContext => ({
  loaderManager: createLoaderManager({}),
  isBrowser,
  routeManifest:
    routeManifest ||
    (typeof window !== 'undefined' && (window as any)[ROUTE_MANIFEST]),
});
