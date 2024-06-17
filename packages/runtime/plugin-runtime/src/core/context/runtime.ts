import { Store } from '@modern-js-reduck/store';
import {
  type StaticHandlerContext,
  type Router,
  type RouterState,
} from '@modern-js/runtime-utils/remix-router';
import { createContext } from 'react';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import { createLoaderManager } from '../loader/loaderManager';
import { PluginRunner, runtime } from '../plugin';
import { RouteManifest } from '../../router/runtime/types';
import { SSRServerContext } from '../../ssr/serverRender/types';

export interface BaseRuntimeContext {
  initialData?: Record<string, unknown>;
  loaderManager: ReturnType<typeof createLoaderManager>;
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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  unstable_getBlockNavState?: () => boolean;
}

export interface RuntimeContext extends BaseRuntimeContext {
  [key: string]: any;
}

export const RuntimeReactContext = createContext<RuntimeContext>({} as any);

export const ServerRouterContext = createContext({} as any);

export interface BaseTRuntimeContext {
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

export const getInitialContext = (runner: PluginRunner): RuntimeContext => ({
  loaderManager: createLoaderManager({}),
  runner,
  isBrowser: true,
  routeManifest:
    typeof window !== 'undefined' && (window as any)[ROUTE_MANIFEST],
});
