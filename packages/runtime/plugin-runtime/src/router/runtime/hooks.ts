import { createWaterfall } from '@modern-js/plugin';
import type { RouteObject } from '@modern-js/runtime-utils/router';

const modifyRoutes = createWaterfall<RouteObject[]>();

export { modifyRoutes };
