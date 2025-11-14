import { createAsyncInterruptHook, createSyncHook } from '@modern-js/plugin';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import type { TRuntimeContext } from '../../core/context/runtime';

// only for inhouse use
const modifyRoutes = createSyncHook<(routes: RouteObject[]) => RouteObject[]>();
const onBeforeCreateRoutes =
  createSyncHook<(context: TRuntimeContext) => void>();

export { modifyRoutes, onBeforeCreateRoutes };

export type RouterExtendsHooks = {
  modifyRoutes: typeof modifyRoutes;
  onBeforeCreateRoutes: typeof onBeforeCreateRoutes;
};
