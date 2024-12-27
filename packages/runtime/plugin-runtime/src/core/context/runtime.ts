import type { Store } from '@modern-js-reduck/store';
import type {
  Router,
  RouterState,
  StaticHandlerContext,
} from '@modern-js/runtime-utils/remix-router';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import { createContext } from 'react';
import type { RouteManifest } from '../../router/runtime/types';
import type { createLoaderManager } from '../loader/loaderManager';
import type { PluginRunner, runtime } from '../plugin';
import type { SSRServerContext, TSSRContext } from '../types';

interface BaseRuntimeContext {
  initialData?: Record<string, unknown>;
  loaderManager: ReturnType<typeof createLoaderManager>;
  isBrowser: boolean;
  runner: ReturnType<typeof runtime.init>;
  // ssr type
  ssrContext?: SSRServerContext;
  // state type
  store?: Store;
  routeManifest: RouteManifest;
  routerContext?: StaticHandlerContext;
  /**
   * private
   */
  unstable_getBlockNavState?: () => boolean;
}

export interface RuntimeContext extends BaseRuntimeContext {
  [key: string]: any;
}

export const RuntimeReactContext = createContext<RuntimeContext>({} as any);

export const ServerRouterContext = createContext({} as any);

export interface TRuntimeContext extends Partial<BaseRuntimeContext> {
  initialData?: Record<string, unknown>;
  isBrowser: boolean;
  context: TSSRContext;
  /** @deprecated use context.request field instead */
  request?: SSRServerContext['request'];
  /** @deprecated use context.response field instead */
  response?: SSRServerContext['response'];
  // store type
  store?: Store;
  [key: string]: any;
}

export { getInitialContext } from './shared';
