import type { storage } from '../node/storage';

export const getAsyncLocalStorage = async (): Promise<
  typeof storage | null
> => {
  return Promise.resolve(null);
};

export const getRequest: () => Request | null = () => {
  return null;
};
