import type { InternalRuntimeContext } from '@modern-js/plugin';
import type { NestedRoute, PageRoute } from '@modern-js/types';
import type React from 'react';
import type { RuntimeExtends } from '../plugin/types';
import type { ServerPayload } from './serverPayload/index';

export {
  type TRuntimeContext,
  type TInternalRuntimeContext,
  RuntimeContext,
  InternalRuntimeContext,
  getInitialContext,
} from './runtime';

export type { ServerPayload, PayloadRoute } from './serverPayload/index';

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
  /**
   * Entry basename for routing
   */
  basename?: string;

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
  globalContext.basename = context.basename;
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

export function getGlobalLayoutApp() {
  return globalContext.layoutApp;
}

export function getGlobalBasename() {
  return globalContext.basename;
}
