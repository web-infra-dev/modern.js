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
import type { SSRServerContext } from '../types';

export interface BaseRuntimeContext {
  initialData?: Record<string, unknown>;
  loaderManager?: ReturnType<typeof createLoaderManager>;
  runner: ReturnType<typeof runtime.init>;
  // ssr type
  ssrContext?: SSRServerContext;
  // state type
  store?: Store;
  routeManifest: RouteManifest;
  routerContext?: StaticHandlerContext;
  /**
   * private method
   */
  remixRouter?: Router;
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

export interface BaseTRuntimeContext extends Partial<BaseRuntimeContext> {
  initialData?: Record<string, unknown>;
  // ssr type
  request?: SSRServerContext['request'];
  response?: SSRServerContext['response'];
  // store type
  store?: Store;
  router?: {
    navigate: Router['navigate'];
    location: RouterState['location'];
  };
}

export interface TRuntimeContext extends BaseTRuntimeContext {
  [key: string]: any;
}

export { getInitialContext } from './shared';
