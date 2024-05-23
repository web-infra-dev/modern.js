import { NestedRoute, PageRoute } from '@modern-js/types';

interface GlobalContext {
  App?: React.ComponentType;
  routes?: (NestedRoute | PageRoute)[];
}

const globalContext: GlobalContext = {};

export function setGlobalContext(context: GlobalContext) {
  console.log('setGlobalContext', context);
  globalContext.App = context.App;
  globalContext.routes = context.routes;
}

export function getGlobalApp() {
  return globalContext.App;
}

export function getGlobalRoutes(): (NestedRoute | PageRoute)[] {
  return globalContext.routes!;
}
