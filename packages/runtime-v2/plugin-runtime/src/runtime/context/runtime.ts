import { createContext } from 'react';
import { PluginRunner, runtime } from '../plugin';

export interface BaseRuntimeContext {
  initialData?: Record<string, unknown>;
  runner?: ReturnType<typeof runtime.init>;
}

export interface RuntimeContext extends BaseRuntimeContext {
  [key: string]: any;
}

export const RuntimeReactContext = createContext<RuntimeContext>({});

export const getInitialContext = (runner: PluginRunner) => ({
  runner,
  isBrowser: true,
});
