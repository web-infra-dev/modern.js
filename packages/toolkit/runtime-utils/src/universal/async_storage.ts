import type { Storage } from './async_storage.server';

const isBrowser =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Fallback for test environment where IS_WEB is not defined, for ut test and bff cases
// @ts-ignore
const IS_WEB_FALLBACK = typeof IS_WEB !== 'undefined' ? IS_WEB : isBrowser;

export const getAsyncLocalStorage = async (): Promise<Storage | null> => {
  if (isBrowser) {
    console.error('You should not get async storage in browser');
    return null;
  } else {
    try {
      if (!IS_WEB_FALLBACK) {
        const serverStorage = await import('./async_storage.server');
        return serverStorage.getAsyncLocalStorage();
      }
    } catch (err) {
      console.error('Failed to load server async storage', err);
      return null;
    }
    return null;
  }
};
