import type { InternalRuntimeContext } from '@modern-js/plugin';
import type { RouterState } from '@modern-js/runtime-utils/router';
import type { NestedRoute, PageRoute } from '@modern-js/types';
import type React from 'react';
import type { RuntimeExtends } from '../plugin/types';

export {
  type RuntimeContext,
  RuntimeReactContext,
  getInitialContext,
} from './runtime';

export type PayloadRoute = {
  clientAction?: any;
  clientLoader?: any;
  element?: React.ReactNode;
  errorElement?: React.ReactNode;
  handle?: any;
  hasAction: boolean;
  hasErrorBoundary: boolean;
  hasLoader: boolean;
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

interface GlobalContext {
  entryName?: string;
  /**
   * App.tsx export default component
   */
  App?: React.ComponentType;
  /**
   * nest router and page router config
   */
  routes?: (NestedRoute | PageRoute)[];
  /**
   * nest router init function
   */
  appInit?: () => Promise<unknown>;
  /**
   * page router _app.tsx export layout app
   */
  layoutApp?: React.ComponentType;

  internalRuntimeContext?: InternalRuntimeContext<RuntimeExtends>;
  /**
   * RSCRoot
   */
  RSCRoot?: React.ComponentType;
  isRscClient?: boolean;
  serverPayload?: ServerPayload;
  enableRsc?: boolean;
}

const globalContext: GlobalContext = {};

export {
  getServerPayload,
  setServerPayload,
} from './serverPayload/index';

export function getGlobalIsRscClient() {
  return globalContext.isRscClient;
}

export function getGlobalEnableRsc() {
  return globalContext.enableRsc;
}

export function setGlobalContext(
  context: Omit<GlobalContext, 'internalRuntimeContext'>,
) {
  globalContext.entryName = context.entryName;
  globalContext.App = context.App;
  globalContext.routes = context.routes;
  globalContext.appInit = context.appInit;
  globalContext.layoutApp = context.layoutApp;
  globalContext.RSCRoot = context.RSCRoot;
  globalContext.isRscClient = context.isRscClient;
  globalContext.enableRsc = context.enableRsc;
}

export function getCurrentEntryName() {
  return globalContext.entryName;
}

export function getGlobalRSCRoot() {
  return globalContext.RSCRoot;
}

export function setGlobalInternalRuntimeContext(
  context: InternalRuntimeContext<RuntimeExtends>,
) {
  globalContext.internalRuntimeContext = context;
}

export function getGlobalInternalRuntimeContext() {
  return globalContext.internalRuntimeContext!;
}

export function getGlobalApp() {
  return globalContext.App;
}

export function getGlobalRoutes(): undefined | (NestedRoute | PageRoute)[] {
  return globalContext.routes;
}

export function getGlobalAppInit() {
  return (
    globalContext.appInit ||
    (getGlobalApp() as any)?.init ||
    (getGlobalLayoutApp() as any)?.init
  );
}

export function getGlobalLayoutApp() {
  return globalContext.layoutApp;
}
