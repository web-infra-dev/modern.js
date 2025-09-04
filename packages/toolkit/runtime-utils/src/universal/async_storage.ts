// This file is an `async_storage` proxy for browser bundle.
import type { Storage } from './async_storage.server';

const isBrowser =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const getAsyncLocalStorage = async (): Promise<
  Storage | null | undefined
> => {
  return null;
};
