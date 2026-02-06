import { storage } from '@modern-js/runtime-utils/node';
import type { RouterState } from '@modern-js/runtime-utils/router';

export type PayloadRoute = {
  clientAction?: any;
  clientLoader?: any;
  element?: React.ReactNode;
  errorElement?: React.ReactNode;
  handle?: any;
  hasAction: boolean;
  hasErrorBoundary: boolean;
  hasLoader: boolean;
  hasClientLoader?: boolean;
  id: string;
  index?: boolean;
  params: Record<string, string>;
  parentId?: string;
  path?: string;
  pathname: string;
  pathnameBase: string;
  shouldRevalidate?: any;
};

export type ServerPayload = {
  type: 'render';
  actionData: RouterState['actionData'];
  errors: RouterState['errors'];
  loaderData: RouterState['loaderData'];
  location: RouterState['location'];
  routes: PayloadRoute[];
  originalRoutes?: PayloadRoute[];
};

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
