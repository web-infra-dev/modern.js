import type { RequestContext } from '@modern-js/runtime-utils/node';
import type {
  Params,
  RouteObject,
  RouteProps,
} from '@modern-js/runtime-utils/router';
import type { NestedRoute, PageRoute } from '@modern-js/types';

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
  /**
   * Select the router implementation used by Modern.js conventional routing.
   * - `react-router` (default): React Router v7 based integration
   * - `tanstack`: TanStack Router integration
   */
  framework?: 'react-router' | 'tanstack';
  routesConfig: {
    globalApp?: React.ComponentType<any>;
    routes?: (NestedRoute | PageRoute)[];
  };
  /**
   * You should not use it
   */
  oldVersion?: boolean;
  serverBase?: string[];
  supportHtml5History?: boolean;
  basename?: string;
  createRoutes?: () => RouteObject[];
  future?: Partial<{
    v7_startTransition: boolean;
  }>;
  /**
   * An unstable feature, which will reload the page when the current browser URL and the SSR Context URL do not match.
   */
  unstable_reloadOnURLMismatch?: boolean;
};

export type Routes = RouterConfig['routesConfig']['routes'];

export interface RouteManifest {
  routeAssets: RouteAssets;
}

export interface RouteAssets {
  [routeId: string]: {
    chunkIds?: (string | number)[];
    assets?: string[];
  };
}

// fork from react-router
// due to the context is any in react-router.
interface DataFunctionArgs<D = any> {
  request: Request;
  params: Params;
  context?: D;
}

export type LoaderFunctionArgs<
  P extends Record<string, unknown> = Record<string, unknown>,
> = DataFunctionArgs<RequestContext<P>>;

declare type DataFunctionValue = Response | NonNullable<unknown> | null;

export type LoaderFunction = <
  P extends Record<string, unknown> = Record<string, unknown>,
>(
  args: LoaderFunctionArgs<P>,
) => Promise<DataFunctionValue> | DataFunctionValue;
