// This file is an `async_storage` proxy for browser bundle.
import type { Storage } from './async_storage.server';

const isBrowser =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const getAsyncLocalStorage = (): Storage | null => {
  if (isBrowser) {
    console.error('You should not get async storage in browser');
    return null;
  } else {
    try {
      const serverStorage = require('./async_storage.server');
      return serverStorage.getAsyncLocalStorage();
    } catch (err) {
      console.error('Failed to load server async storage', err);
      return null;
    }
  }
};
