import type { RouteProps } from 'react-router-dom';
import { PageRoute, NestedRoute } from '@modern-js/types';

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

export type SingleRouteConfig = RouteProps & {
  redirect?: string;
  routes?: SingleRouteConfig[];
  key?: string;

  /**
   * layout component
   */
  layout?: React.ComponentType;

  /**
   * component would be rendered when route macthed.
   */
  component?: React.ComponentType;
};

export type RouterConfig = {
  legacy?: boolean;
  routesConfig: {
    globalApp?: React.ComponentType<any>;
    routes: (NestedRoute | PageRoute)[];
  };
  serverBase?: string[];
  supportHtml5History?: boolean;
  configRoutes: any;
};
