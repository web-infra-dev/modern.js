import { NestedRoute } from '@modern-js/types';

interface GlobalContext {
  App?: React.ComponentType;
  routes?: NestedRoute[];
}

const globalContext: GlobalContext = {};

export function setGlobalContext(context: GlobalContext) {
  globalContext.App = context.App;
  globalContext.routes = context.routes;
}

export function getGlobalApp() {
  return globalContext.App;
}

export function getGlobalRoutes() {
  return globalContext.routes;
}
