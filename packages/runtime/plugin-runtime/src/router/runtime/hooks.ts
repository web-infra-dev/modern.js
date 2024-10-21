import {
  createAsyncInterruptWorkflow,
  createWaterfall,
} from '@modern-js/plugin';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import type { RuntimeContext } from '../../core';

const modifyRoutes = createWaterfall<RouteObject[]>();
const beforeCreateRoutes = createAsyncInterruptWorkflow<RuntimeContext, void>();

export { modifyRoutes, beforeCreateRoutes };
