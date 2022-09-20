import { Store } from '@modern-js-reduck/store';
import { createContext } from 'react';
import { createLoaderManager } from './core/loader/loaderManager';
import { runtime } from './core/plugin';
import { SSRServerContext } from './ssr/serverRender/type';

export interface BaseRuntimeContext {
  loaderManager: ReturnType<typeof createLoaderManager>;
  runner: ReturnType<typeof runtime.init>;
  // ssr type
  ssrContext?: SSRServerContext;
  // state type
  store?: Store;
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
}

export interface TRuntimeContext extends BaseTRuntimeContext {
  [key: string]: any;
}
