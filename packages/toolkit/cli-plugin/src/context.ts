import { initHooks } from './hooks';
import type { InternalContext } from './types/context';

export async function createContext(): Promise<InternalContext> {
  return {
    hooks: initHooks(),
    config: {},
    normalizedConfig: {},
  };
}
