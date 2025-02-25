import { storage } from '@modern-js/runtime-utils/node';

export const getRequest: () => Request = () => {
  const context = storage.useContext();
  return context?.request!;
};
