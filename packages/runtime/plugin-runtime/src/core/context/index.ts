import type { NestedRoute, PageRoute } from '@modern-js/types';
import { AppConfig } from '../../common';

export { RuntimeReactContext, type RuntimeContext } from './runtime';

interface GlobalContext {
  App?: React.ComponentType;
  routes?: (NestedRoute | PageRoute)[];
  appInit?: () => Promise<unknown>;
  appConfig?: AppConfig;
}

const globalContext: GlobalContext = {};

export function setGlobalContext(context: GlobalContext) {
  globalContext.App = context.App;
  globalContext.routes = context.routes;
  globalContext.appInit = context.appInit;
  globalContext.appConfig = context.appConfig;
}

export function getGlobalApp() {
  return globalContext.App;
}

export function getGlobalRoutes(): undefined | (NestedRoute | PageRoute)[] {
  return globalContext.routes;
}

export function getGlobalAppInit() {
  return globalContext.appInit || (getGlobalApp() as any)?.init;
}

export function getGlobalAppConfig() {
  return globalContext.appConfig || (getGlobalApp() as any)?.config;
}
