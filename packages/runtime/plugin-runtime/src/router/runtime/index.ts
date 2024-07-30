import { useRouteLoaderData as useRouteData } from '@modern-js/runtime-utils/router';
import { routerPlugin } from './plugin';
import type { RouterConfig, SingleRouteConfig } from './types';

declare const MODERN_ROUTER_ID_PREFIX: string | undefined;
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
  const routerIdPrefix =
    typeof MODERN_ROUTER_ID_PREFIX === 'string' ? MODERN_ROUTER_ID_PREFIX : '';
  let routeIdWithOutPrefix = routeId;
  if (routeId.includes(routerIdPrefix)) {
    routeIdWithOutPrefix = routeId.replace(routerIdPrefix, '');
  }
  const realRouteId = routeIdWithOutPrefix.replace(/\[(.*?)\]/g, '($1)');
  return useRouteData(realRouteId);
};

export {
  createShouldRevalidate,
  handleRouteModule,
  handleRouteModuleError,
} from './routeModule';

export type { LoaderFunction, LoaderFunctionArgs } from './types';
