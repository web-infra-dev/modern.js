// This file is an `async_storage` proxy for browser bundle.
import type { Storage } from './async_storage.server';

export const getAsyncLocalStorage = (): Storage | null => {
  console.error('You should not get async storage in browser');
  return null;
};
