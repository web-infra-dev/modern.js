import type { ServerRoute } from '@modern-js/types';
import { getPath } from 'hono/utils/url';

export const sortRoutes = (route1: ServerRoute, route2: ServerRoute) => {
  return route2.urlPath.length - route1.urlPath.length;
};

// Because the same entryName may have different urlPath(ssg), so we need to add urlPath as key
export const uniqueKeyByRoute = (route: ServerRoute) => {
  return `${route.entryName!}-${route.urlPath}`;
};

export const getRoutePath = ({ urlPath, isSSG }: ServerRoute): string => {
  if (isSSG) {
    // Match the same decoded pathname Hono uses for incoming requests while
    // retaining reserved URL characters such as encoded slashes and percent.
    const pathname = getPath({ url: `http://localhost${urlPath}` } as Request);
    if (/[*:{}]/.test(pathname)) {
      // SSG paths are literal URLs. A single constrained parameter also handles
      // a literal "*" without registering a wildcard. Encode every code unit to
      // avoid Hono interpreting braces or internal regexp markers in the path.
      const literal = pathname
        .slice(1)
        .split('')
        .map(char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
        .join('');
      return `/:__modern_ssg{${literal}}`;
    }
    return pathname;
  }
  return urlPath.endsWith('/') ? `${urlPath}*` : `${urlPath}/*`;
};
