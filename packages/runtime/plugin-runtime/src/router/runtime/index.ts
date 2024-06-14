import { useRouteLoaderData as useRouteData } from '@modern-js/runtime-utils/router';
import { routerPlugin } from './plugin';
import type { SingleRouteConfig, RouterConfig } from './types';

export * from '@modern-js/runtime-utils/router';

export type { SingleRouteConfig, RouterConfig };
export { renderRoutes } from './utils';

export { routerPlugin };
export default routerPlugin;

export { modifyRoutes } from './plugin';

export * from './withRouter';

export { Link, NavLink } from './PrefetchLink';
export type { LinkProps, NavLinkProps } from './PrefetchLink';

export const useRouteLoaderData: typeof useRouteData = (routeId: string) => {
  const realRouteId = routeId.replace(/\[(.*?)\]/g, '($1)');
  return useRouteData(realRouteId);
};

export {
  createShouldRevalidate,
  handleRouteModule,
  handleRouteModuleError,
} from './routeModule';

export type { LoaderFunction, LoaderFunctionArgs } from './types';
