import { initHooks } from './hooks';
import type { AppContext, InternalContext } from './types/context';

interface ContextParams {
  appContext: AppContext;
}

export async function createContext({
  appContext,
}: ContextParams): Promise<InternalContext> {
  return {
    ...appContext,
    hooks: initHooks(),
    config: {},
    normalizedConfig: {},
  };
}
