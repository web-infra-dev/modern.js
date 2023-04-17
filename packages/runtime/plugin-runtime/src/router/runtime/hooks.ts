import { createWaterfall } from '@modern-js/plugin';
import { RouteObject } from 'react-router-dom';

const modifyRoutes = createWaterfall<RouteObject[]>();

export { modifyRoutes };
