import { ServerFunctions } from '@modern-js/devtools-kit';

export interface StoreContextValue {
  router: {
    serverRoutes: ReturnType<ServerFunctions['getServerRoutes']>;
  };
  config: {
    frameworkConfig: ReturnType<ServerFunctions['getFrameworkConfig']>;
  };
}
