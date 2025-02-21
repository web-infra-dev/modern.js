import type { AsyncLocalStorage } from 'async_hooks';

export const getAsyncLocalStorage =
  (): Promise<AsyncLocalStorage<Request> | null> => {
    return Promise.resolve(null);
  };
