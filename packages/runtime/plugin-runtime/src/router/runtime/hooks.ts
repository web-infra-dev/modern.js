import { createRuntimeSyncHook } from '@modern-js/plugin/runtime';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import type { TRuntimeContext } from '../../core/context/runtime';

/** Hook registrations belong to each application, including page requests. */
export function createRouterHooks() {
  return {
    modifyRoutes:
      createRuntimeSyncHook<(routes: RouteObject[]) => RouteObject[]>(),
    onBeforeCreateRoutes:
      createRuntimeSyncHook<(context: TRuntimeContext) => void>(),
  };
}
export type RouterExtendsHooks = ReturnType<typeof createRouterHooks>;
