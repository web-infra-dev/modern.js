import type { InternalRuntimeContext } from '@modern-js/plugin-v2';
import type { NestedRoute, PageRoute } from '@modern-js/types';
import type React from 'react';
import type { AppConfig } from '../../common';
import type { RuntimeExtends } from '../plugin/types';
import type { ServerPayload } from './serverPayload';

export {
  type RuntimeContext,
  RuntimeReactContext,
  getInitialContext,
} from './runtime';

export type { ServerPayload, PayloadRoute } from './serverPayload';

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
   * nest router config function
   */
  appConfig?: AppConfig;
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
} from './serverPayload';

export function getGlobalIsRscClient() {
  return globalContext.isRscClient;
}

export function getGlobalEnableRsc() {
  return globalContext.enableRsc;
}

export function setGlobalContext(
  context: Omit<GlobalContext, 'appConfig' | 'internalRuntimeContext'> & {
    appConfig?: () => AppConfig;
  },
) {
  globalContext.entryName = context.entryName;
  globalContext.App = context.App;
  globalContext.routes = context.routes;
  globalContext.appInit = context.appInit;
  globalContext.appConfig =
    typeof context.appConfig === 'function'
      ? context.appConfig()
      : context.appConfig;
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

export function getGlobalAppConfig() {
  return (
    globalContext.appConfig ||
    (getGlobalApp() as any)?.config ||
    (getGlobalLayoutApp() as any)?.config
  );
}

export function getGlobalLayoutApp() {
  return globalContext.layoutApp;
}
