import type { AsyncLocalStorage } from 'async_hooks';

let asyncLocalStorage: AsyncLocalStorage<Request> | null = null;

export async function getAsyncLocalStorage(): Promise<AsyncLocalStorage<Request> | null> {
  if (!asyncLocalStorage) {
    const { AsyncLocalStorage } = await import('async_hooks');
    asyncLocalStorage = new AsyncLocalStorage<Request>();
  }
  return asyncLocalStorage;
}
