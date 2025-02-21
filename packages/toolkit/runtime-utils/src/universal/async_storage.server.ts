import type { AsyncLocalStorage } from 'async_hooks';
import type { Store } from './async_storage';

let asyncLocalStorage: AsyncLocalStorage<Store> | null = null;

export async function getAsyncLocalStorage(): Promise<AsyncLocalStorage<Store> | null> {
  if (!asyncLocalStorage) {
    const { AsyncLocalStorage } = await import('async_hooks');
    asyncLocalStorage = new AsyncLocalStorage<Store>();
  }
  return asyncLocalStorage;
}
