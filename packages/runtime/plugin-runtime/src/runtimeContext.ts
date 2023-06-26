import { Store } from '@modern-js-reduck/store';
import {
  type StaticHandlerContext,
  type Router,
  type RouterState,
} from '@modern-js/utils/runtime/remix-router';
import { createContext } from 'react';
import { createLoaderManager } from './core/loader/loaderManager';
import { runtime } from './core/plugin';
import { RouteManifest } from './router/runtime/types';
import { SSRServerContext } from './ssr/serverRender/types';

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
