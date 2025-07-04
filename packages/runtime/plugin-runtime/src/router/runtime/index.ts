import { useRouteLoaderData as useRouteData } from '@modern-js/runtime-utils/router';

export * from '@modern-js/runtime-utils/router';

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

export * from './withRouter';

export type { LoaderFunction, LoaderFunctionArgs } from './types';
