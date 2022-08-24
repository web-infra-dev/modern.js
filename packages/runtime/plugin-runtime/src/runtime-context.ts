import { createContext } from 'react';
import { Store } from '@modern-js-reduck/store';
import { SSRServerContext } from './plugins/ssr/serverRender/type';
import { createLoaderManager } from './runtime/loader/loaderManager';
import { runtime } from './runtime/plugin';

export interface RuntimeContext {
  loaderManager: ReturnType<typeof createLoaderManager>;
  runner: ReturnType<typeof runtime.init>;
  ssrContext: SSRServerContext;
  store: Store;
  [key: string]: any;
}

export const RuntimeReactContext = createContext<RuntimeContext>({} as any);

export interface TRuntimeContext {
  initialData?: Record<string, unknown>;
  request: SSRServerContext['request'];
  response: SSRServerContext['response'];
  store: Store;
  [key: string]: any;
}
