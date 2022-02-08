import { createContext } from 'react';
import { createLoaderManager } from './loader/loaderManager';
import { runtime } from './plugin';

export interface RuntimeContext {
  loaderManager: ReturnType<typeof createLoaderManager>;
  runner: ReturnType<typeof runtime.init>;
  ssrContext?: any;
  [key: string]: any;
}

export const RuntimeReactContext = createContext<RuntimeContext>({} as any);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TRuntimeContext {}
