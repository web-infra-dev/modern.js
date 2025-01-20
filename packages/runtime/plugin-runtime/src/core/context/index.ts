import type { InternalRuntimeContext } from '@modern-js/plugin-v2';
import type { NestedRoute, PageRoute } from '@modern-js/types';
import type { AppConfig } from '../../common';
import type { RuntimeExtends } from '../plugin/types';

export {
  type RuntimeContext,
  RuntimeReactContext,
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

  internalRuntimeContext?: InternalRuntimeContext<RuntimeExtends>;
}

const globalContext: GlobalContext = {};

export function setGlobalContext(
  context: Omit<GlobalContext, 'appConfig' | 'internalRuntimeContext'> & {
    appConfig?: () => AppConfig;
  },
) {
  globalContext.App = context.App;
  globalContext.routes = context.routes;
  globalContext.appInit = context.appInit;
  globalContext.appConfig =
    typeof context.appConfig === 'function'
      ? context.appConfig()
      : context.appConfig;
  globalContext.layoutApp = context.layoutApp;
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
