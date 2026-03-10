import { storage } from '@modern-js/runtime-utils/node';
import type {
  RouterState,
  ShouldRevalidateFunction,
} from '@modern-js/runtime-utils/router';

export type PayloadRoute = {
  clientAction?: (...args: unknown[]) => unknown;
  clientLoader?: (...args: unknown[]) => unknown;
  element?: React.ReactNode;
  errorElement?: React.ReactNode;
  handle?: unknown;
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
  shouldRevalidate?: ShouldRevalidateFunction;
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
