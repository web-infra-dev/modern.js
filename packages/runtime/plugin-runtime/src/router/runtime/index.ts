import { routerPlugin } from './plugin';
import type { SingleRouteConfig, RouterConfig } from './plugin';
import type { Route } from './ConfigRoutes';

export type DefinedRoute = Omit<Route, 'component'> & {
  component: string;
};

export type DefinedRoutes = DefinedRoute[];

export type { SingleRouteConfig, RouterConfig };

export default routerPlugin;

export * from 'react-router-dom';

export * from './withRouter';
