import { createAsyncInterruptHook, createSyncHook } from '@modern-js/plugin-v2';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import type { RuntimeContext } from '../../core';

// only for inhouse use
const modifyRoutes = createSyncHook<(routes: RouteObject[]) => RouteObject[]>();
const onBeforeCreateRoutes =
  createAsyncInterruptHook<
    (context: RuntimeContext, interrupt: (info: any) => any) => void
  >();

export { modifyRoutes, onBeforeCreateRoutes };
