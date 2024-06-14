import { NestedRoute, PageRoute } from '@modern-js/types';

export { RuntimeReactContext } from './runtime';

interface GlobalContext {
  App?: React.ComponentType;
  routes?: (NestedRoute | PageRoute)[];
}

const globalContext: GlobalContext = {};

export function setGlobalContext(context: GlobalContext) {
  globalContext.App = context.App;
  globalContext.routes = context.routes;
}

export function getGlobalApp() {
  return globalContext.App;
}

export function getGlobalRoutes(): undefined | (NestedRoute | PageRoute)[] {
  return globalContext.routes;
}
