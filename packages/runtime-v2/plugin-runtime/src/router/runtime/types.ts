import { RouteObject } from '@modern-js/runtime-utils/router';
import { NestedRoute, PageRoute } from '@modern-js/types';

export type RouterConfig = {
  mode?: 'react-router-5';
  routesConfig: {
    globalApp?: React.ComponentType<any>;
    routes: (NestedRoute | PageRoute)[];
  };
  serverBase?: string[];
  supportHtml5History?: boolean;
  originalBaseUrl?: string;
  basename?: string;
  createRoutes?: () => RouteObject[];
};

export type Routes = RouterConfig['routesConfig']['routes'];

declare global {
  interface Window {
    _SERVER_DATA?: {
      router: {
        baseUrl: string;
        params: Record<string, string>;
      };
    };
  }
}
