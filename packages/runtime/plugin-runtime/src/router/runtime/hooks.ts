import { createSyncHook } from '@modern-js/plugin';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import type { TRuntimeContext } from '../../core/context/runtime';
import type { RouterLifecycleContext } from './lifecycle';

// only for inhouse use
const modifyRoutes = createSyncHook<(routes: RouteObject[]) => RouteObject[]>();
const onBeforeCreateRoutes =
  createSyncHook<(context: TRuntimeContext) => void>();
const onBeforeCreateRouter =
  createSyncHook<(context: RouterLifecycleContext) => void>();
const onAfterCreateRouter =
  createSyncHook<(context: RouterLifecycleContext) => void>();
const onBeforeHydrateRouter =
  createSyncHook<(context: RouterLifecycleContext) => void>();
const onAfterHydrateRouter =
  createSyncHook<(context: RouterLifecycleContext) => void>();

export {
  modifyRoutes,
  onAfterCreateRouter,
  onAfterHydrateRouter,
  onBeforeCreateRouter,
  onBeforeCreateRoutes,
  onBeforeHydrateRouter,
};

export type RouterExtendsHooks = {
  modifyRoutes: typeof modifyRoutes;
  onBeforeCreateRoutes: typeof onBeforeCreateRoutes;
  onBeforeCreateRouter: typeof onBeforeCreateRouter;
  onAfterCreateRouter: typeof onAfterCreateRouter;
  onBeforeHydrateRouter: typeof onBeforeHydrateRouter;
  onAfterHydrateRouter: typeof onAfterHydrateRouter;
};
