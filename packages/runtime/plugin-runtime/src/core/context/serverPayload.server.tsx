import { storage } from '@modern-js/runtime-utils/node';
import type { ServerPayload } from './index';

export const getServerPayload = (): ServerPayload | undefined => {
  const context = storage.useContext() as any;
  return context?.serverPayload;
};

export const setServerPayload = (payload: ServerPayload): void => {
  const context = storage.useContext() as any;
  if (context) {
    context.serverPayload = payload;
  }
};
