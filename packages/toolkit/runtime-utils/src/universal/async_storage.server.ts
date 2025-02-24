import { storage } from '../node/storage';

export const getAsyncLocalStorage = async (): Promise<
  typeof storage | null
> => {
  return storage;
};

export const getRequest: () => Request | null | undefined = () => {
  const context = storage.useContext();
  return context?.request;
};
