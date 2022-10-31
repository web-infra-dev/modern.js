import { routerPlugin } from './plugin';
import type { Route } from './createConfigRoutes';
import type { SingleRouteConfig, RouterConfig } from './types';

export type DefinedRoute = Omit<Route, 'component'> & {
  component: string;
};

export type DefinedRoutes = DefinedRoute[];

export type { SingleRouteConfig, RouterConfig };

export default routerPlugin;

export * from 'react-router-dom';

export * from './withRouter';
