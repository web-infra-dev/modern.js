import { ServerFunctions } from '@modern-js/devtools-kit';
import type { CustomTabView } from '@modern-js/devtools-kit';

export interface StoreContextValue {
  dataSource: string;
  router: {
    serverRoutes: ReturnType<ServerFunctions['getServerRoutes']>;
  };
  config: {
    frameworkConfig: ReturnType<ServerFunctions['getFrameworkConfig']>;
  };
  tabs: InternalTab[];
}

export interface BuiltinTabView {
  type: 'builtin';
  url: string;
}

export type InternalTabView = CustomTabView | BuiltinTabView;

export interface InternalTab {
  name: string;
  title: string;
  view: InternalTabView;
  icon?: string;
}
