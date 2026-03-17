import { createSyncHook } from '@modern-js/plugin';
import type { RouteObject } from '@modern-js/runtime/router';
import type { TRuntimeContext } from '@modern-js/runtime';

const modifyRoutes = createSyncHook<(routes: RouteObject[]) => RouteObject[]>();
const onBeforeCreateRoutes =
  createSyncHook<(context: TRuntimeContext) => void>();

export { modifyRoutes, onBeforeCreateRoutes };

export type TanstackRouterExtendsHooks = {
  modifyRoutes: typeof modifyRoutes;
  onBeforeCreateRoutes: typeof onBeforeCreateRoutes;
};
