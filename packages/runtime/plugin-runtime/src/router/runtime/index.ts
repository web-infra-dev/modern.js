import { routerPlugin } from './plugin';
import type { Route, ConfigRoutesLazy } from './ConfigRoutes';
import type { SingleRouteConfig, RouterConfig } from './types';

export type DefinedRoute = Omit<Route, 'component'> & {
  component: string;
};

export type DefinedRoutes = DefinedRoute[];

export type { SingleRouteConfig, RouterConfig, ConfigRoutesLazy };

export default routerPlugin;

export * from 'react-router-dom';

export * from './withRouter';
