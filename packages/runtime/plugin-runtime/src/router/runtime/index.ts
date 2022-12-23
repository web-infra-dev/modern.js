import { routerPlugin } from './plugin';
import type { SingleRouteConfig, RouterConfig } from './types';

export type { SingleRouteConfig, RouterConfig };

export default routerPlugin;

export { modifyRoutes } from './plugin';

export * from 'react-router-dom';

export * from './withRouter';
