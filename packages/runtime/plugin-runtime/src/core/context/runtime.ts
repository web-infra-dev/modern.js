import type { RouteObject } from '@modern-js/runtime-utils/router';
import type { StaticHandlerContext } from '@modern-js/runtime-utils/router';
import type { DataRouter } from '@modern-js/runtime-utils/router';
import { createContext, useContext } from 'react';
import type { RouteManifest, RouterConfig } from '../../router/runtime/types';
import type { RequestContext, SSRServerContext } from '../types';
import type { BaseSSRServerContext } from '@modern-js/types';

export interface TRuntimeContext {
  initialData?: Record<string, unknown>;
  /** Language serialized by this application's server render. */
  __i18nData__?: { lng: string };
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
  application?: {
    definition: import('../application/definition').ApplicationDefinition;
    Root?: import('react').ComponentType<any>;
    output: 'document' | 'fragment';
    config?: RouterConfig['routesConfig'];
    initialUrl: string;
    hydrationData?: import('../types').RouterSSRData;
    getDataUrl?: (url: URL) => URL;
    memory?: boolean;
    hash?: boolean;
    basename?: string;
    getWindow?: () => Window;
    onRouterCreated?: (router: DataRouter) => void;
    router?: DataRouter;
    releaseRouter?: () => void;
    routes?: RouteObject[];
  };
  routeManifest?: RouteManifest;
  assetBase?: string;
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
/**
 * deprecated, use RuntimeContext instead
 */
export const ReactRuntimeContext = RuntimeContext;

export const getInitialContext = (
  isBrowser = true,
  routeManifest?: RouteManifest,
  ssrContext?: SSRServerContext,
): TInternalRuntimeContext => {
  const requestContext = makeRequestContext(ssrContext);
  return {
    isBrowser,
    routeManifest,
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

/** Derive request aliases before any capability or user plugin executes. */
export function makeRequestContext(
  ssrContext?: SSRServerContext,
): RequestContext {
  return {
    request: ssrContext?.request || ({} as BaseSSRServerContext['request']),
    response: ssrContext?.response || ({} as BaseSSRServerContext['response']),
  };
}
