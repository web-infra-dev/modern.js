import { useRouteLoaderData as useRouteData } from '@modern-js/runtime-utils/router';

export * from '@modern-js/runtime-utils/router';

export { Link, NavLink } from './PrefetchLink';
export type { LinkProps, NavLinkProps } from './PrefetchLink';

export const useRouteLoaderData: typeof useRouteData = (routeId: string) => {
  const realRouteId = routeId.replace(/\[(.*?)\]/g, '($1)');
  return useRouteData(realRouteId);
};

export * from './withRouter';

export {
  MemoryRouteProvider,
  normalizeMemoryRouterConfig,
  useMemoryRoute,
} from './memory';
export type {
  MemoryRouteEntry,
  MemoryRouteProviderProps,
  MemoryRouteState,
  MemoryRouterConfig,
  MemoryRouterOptions,
  NormalizedMemoryRouterConfig,
} from './memory';

export type { LoaderFunction, LoaderFunctionArgs } from './types';
