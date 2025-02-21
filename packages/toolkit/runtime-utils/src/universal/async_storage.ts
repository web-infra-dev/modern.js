import type { AsyncLocalStorage } from 'async_hooks';

export interface Store {
  request: Request;
}

export const getAsyncLocalStorage =
  (): Promise<AsyncLocalStorage<Store> | null> => {
    return Promise.resolve(null);
  };
