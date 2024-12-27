import type { NestedRoute, PageRoute } from '@modern-js/types';
import type { AppConfig } from '../../common';

export {
  RuntimeReactContext,
  type RuntimeContext,
  getInitialContext,
} from './runtime';

interface GlobalContext {
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
  /**
   * RSCRoot
   */
  RSCRoot?: React.ComponentType;
}

const globalContext: GlobalContext = {};

export function setGlobalContext(
  context: Omit<GlobalContext, 'appConfig'> & { appConfig?: () => AppConfig },
) {
  globalContext.App = context.App;
  globalContext.routes = context.routes;
  globalContext.appInit = context.appInit;
  globalContext.appConfig =
    typeof context.appConfig === 'function'
      ? context.appConfig()
      : context.appConfig;
  globalContext.layoutApp = context.layoutApp;
  globalContext.RSCRoot = context.RSCRoot;
}

export function getGlobalRSCRoot() {
  return globalContext.RSCRoot;
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
