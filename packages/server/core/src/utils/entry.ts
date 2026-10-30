import type { ServerRoute } from '@modern-js/types';

export const sortRoutes = (route1: ServerRoute, route2: ServerRoute) => {
  return (
    route2.urlPath.length - route1.urlPath.length ||
    Number(Boolean(route2.isSSG)) - Number(Boolean(route1.isSSG))
  );
};

// Keep prerendered HTML separate from the entry fallback at the same URL.
export const uniqueKeyByRoute = (route: ServerRoute) => {
  return `${route.isSSG ? 'ssg:' : ''}${route.entryName!}-${route.urlPath}`;
};

// SSG pages match only their concrete URL, with either trailing-slash form.
// Entry routes retain their wildcard so unmatched pages can use SSR or CSR.
export const getRoutePaths = (route: ServerRoute): string[] => {
  const { urlPath } = route;
  if (route.isSSG) {
    const pathname = urlPath.replace(/\/$/, '') || '/';
    return pathname === '/' ? ['/'] : [pathname, `${pathname}/`];
  }
  return [urlPath.endsWith('/') ? `${urlPath}*` : `${urlPath}/*`];
};
