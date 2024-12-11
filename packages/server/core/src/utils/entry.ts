import type { ServerRoute } from '@modern-js/types';

export const sortRoutes = (route1: ServerRoute, route2: ServerRoute) => {
  return route2.urlPath.length - route1.urlPath.length;
};

// Because the same entryName may have different urlPath(ssg), so we need to add urlPath as key
export const uniqueKeyByRoute = (route: ServerRoute) => {
  return `${route.entryName!}-${route.urlPath}`;
};
