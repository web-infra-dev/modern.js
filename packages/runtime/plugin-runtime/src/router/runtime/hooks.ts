import { createWaterfall } from '@modern-js/plugin';
import { RouteObject } from '@modern-js/utils/runtime/router';

const modifyRoutes = createWaterfall<RouteObject[]>();

export { modifyRoutes };
