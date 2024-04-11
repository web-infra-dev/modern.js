import { ServerRoute } from '@modern-js/types';

export const sortRoutes = (route1: ServerRoute, route2: ServerRoute) => {
  return route2.urlPath.length - route1.urlPath.length;
};
