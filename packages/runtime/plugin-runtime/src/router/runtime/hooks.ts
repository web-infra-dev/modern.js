import { createAsyncInterruptHook, createSyncHook } from '@modern-js/plugin';
import type { DataRouter, RouteObject } from '@modern-js/runtime-utils/router';
import type { TRuntimeContext } from '../../core/context/runtime';

export type RouterCreatedEvent = {
  router: DataRouter;
  routes: RouteObject[];
  basename: string;
  context: TRuntimeContext;
};

export type RouterStateChangeEvent = {
  router: DataRouter;
  routes: RouteObject[];
  state: DataRouter['state'];
  context: TRuntimeContext;
};

export type RouteLoaderEvent =
  | {
      type: 'start';
      routeId: string;
      args: unknown;
    }
  | {
      type: 'success';
      routeId: string;
      args: unknown;
      result: unknown;
    }
  | {
      type: 'redirect';
      routeId: string;
      args: unknown;
      response: Response;
    }
  | {
      type: 'error';
      routeId: string;
      args: unknown;
      error: unknown;
    };

export type RouteComponentEvent =
  | {
      type: 'module-load';
      routeId: string;
      routeModule: unknown;
    }
  | {
      type: 'module-load-error';
      routeId?: string;
      error: unknown;
    }
  | {
      type: 'render-error';
      routeId: string;
      error: unknown;
      componentStack?: string;
    }
  | {
      type: 'mount';
      routeId: string;
    };

// only for inhouse use
const modifyRoutes = createSyncHook<(routes: RouteObject[]) => RouteObject[]>();
const onBeforeCreateRoutes =
  createSyncHook<(context: TRuntimeContext) => void>();
const onRouterCreated = createSyncHook<(event: RouterCreatedEvent) => void>();
const onRouterStateChange =
  createSyncHook<(event: RouterStateChangeEvent) => void>();
const onRouteLoader = createSyncHook<(event: RouteLoaderEvent) => void>();
const onRouteComponent = createSyncHook<(event: RouteComponentEvent) => void>();

export {
  modifyRoutes,
  onBeforeCreateRoutes,
  onRouterCreated,
  onRouterStateChange,
  onRouteLoader,
  onRouteComponent,
};

export type RouterExtendsHooks = {
  modifyRoutes: typeof modifyRoutes;
  onBeforeCreateRoutes: typeof onBeforeCreateRoutes;
  onRouterCreated: typeof onRouterCreated;
  onRouterStateChange: typeof onRouterStateChange;
  onRouteLoader: typeof onRouteLoader;
  onRouteComponent: typeof onRouteComponent;
};
