import { routerPlugin } from './plugin';
import type { SingleRouteConfig, RouterConfig } from './plugin';

export type { SingleRouteConfig, RouterConfig };

export default routerPlugin;

export * from 'react-router-dom';

export * from './withRouter';
// export * from 'history';
