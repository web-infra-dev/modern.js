import { createSyncHook } from '@modern-js/plugin';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import type { TRuntimeContext } from '../../core/context/runtime';

/** Hook registrations belong to each application, including page requests. */
export function createRouterHooks() {
  return {
    modifyRoutes: createSyncHook<(routes: RouteObject[]) => RouteObject[]>(),
    onBeforeCreateRoutes: createSyncHook<(context: TRuntimeContext) => void>(),
  };
}
export type RouterExtendsHooks = ReturnType<typeof createRouterHooks>;
