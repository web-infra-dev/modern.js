import type { PayloadRoute, ServerPayload } from './index.server';
export type { ServerPayload, PayloadRoute };

export const getServerPayload = (): ServerPayload | undefined => {
  return undefined;
};

export const setServerPayload = (payload: ServerPayload): void => {};
