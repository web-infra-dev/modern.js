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

export type BuiltInRouterFramework = 'react-router' | 'tanstack';
export type RouterFramework = BuiltInRouterFramework | (string & {});

export type RouterConfig = {
  /**
   * Select the router implementation used by Modern.js conventional routing.
   * - `react-router` (default): React Router v7 based integration
   * - `tanstack`: TanStack Router integration
   */
  framework?: RouterFramework;
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

export interface RouterRouteMatchSnapshot {
  routeId: string;
  assetRouteId?: string;
  pathname?: string;
  params?: Record<string, string>;
}

export interface RouteManifest {
  routeAssets: RouteAssets;
}

export interface InternalRouterServerSnapshot {
  framework?: RouterFramework;
  basename?: string;
  statusCode?: number;
  errors?: Record<string, unknown>;
  routerData?: {
    loaderData?: Record<string, unknown>;
    errors?: Record<string, unknown>;
  };
  hydrationScript?: string;
  hydrationScripts?: string[];
  matchedRouteIds?: string[];
  matches?: RouterRouteMatchSnapshot[];
}

export interface InternalRouterRuntimeState {
  framework: RouterFramework;
  basename?: string;
  instance?: unknown;
  hydrationScript?: string;
  hydrationScripts?: string[];
  matchedRouteIds?: string[];
  matches?: RouterRouteMatchSnapshot[];
  serverSnapshot?: InternalRouterServerSnapshot;
  cleanup?: () => void | Promise<void>;
}

export interface RouterServerPrepareResult {
  state: InternalRouterRuntimeState;
  snapshot?: InternalRouterServerSnapshot;
  redirect?: Response;
  cleanup?: () => void | Promise<void>;
}

export interface RouteAssets {
  [routeId: string]: {
    chunkIds?: (string | number)[];
    assets?: string[];
    referenceCssAssets?: string[];
  };
}

export interface LazyComponentDescriptor {
  _init: unknown;
  _payload: unknown;
}

export type ModernRouteObject = RouteObject & {
  isClientComponent?: boolean;
  hasClientLoader?: boolean;
  hasLoader?: boolean;
  hasAction?: boolean;
  parentId?: string;
  lazyImport?: () => Promise<{ default: React.ComponentType }>;
  component?: React.ComponentType | LazyComponentDescriptor;
  entryCssFiles?: string[];
};

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
