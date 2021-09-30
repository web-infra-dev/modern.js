import { generatePath } from 'react-router-dom';
import {
  CreatePageListener,
  CreatePageParam,
  FreshPageConfig,
  SsgRoute,
  UserInterfaceRoute,
} from '../types';
import { formatPath, isDynamicUrl } from './util';

export const createPageFactory =
  (route: UserInterfaceRoute, listener: CreatePageListener) =>
  (config?: CreatePageParam) => {
    if (Array.isArray(config)) {
      config.forEach(cfg => {
        listener(createPage(route, cfg), route.agreed);
      });
    } else {
      listener(createPage(route, config), route.agreed);
    }
  };

function createPage(
  route: UserInterfaceRoute,
  config: FreshPageConfig = {},
): SsgRoute {
  const { path, agreed, ...filterRoute } = route;

  const urlPath = formatPath(config.url || path);
  const ssgRoute: SsgRoute = {
    ...filterRoute,
    urlPath,
  };

  // using params completion dynamic routing
  if (agreed && isDynamicUrl(urlPath) && config.params) {
    ssgRoute.urlPath = generatePath(urlPath, config.params);
  }
  ssgRoute.output = config.output;
  ssgRoute.headers = config.headers;
  return ssgRoute;
}
