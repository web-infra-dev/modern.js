import normalize from 'normalize-path';
import { ModernRoute } from '@modern-js/server';
import { SsgRoute } from '../types';

export function exist(route: ModernRoute, pageRoutes: ModernRoute[]): number {
  return pageRoutes.slice().findIndex(pageRoute => {
    const urlEqual = normalize(pageRoute.urlPath) === normalize(route.urlPath);
    const entryEqual = pageRoute.entryName === route.entryName;
    if (urlEqual && entryEqual) {
      return true;
    }
    return false;
  });
}

export function replaceRoute(ssgRoutes: SsgRoute[], pageRoutes: ModernRoute[]) {
  // remove redundant fields and replace rendered entryPath
  const cleanSsgRoutes = ssgRoutes.map(ssgRoute => {
    const { output, headers, ...cleanSsgRoute } = ssgRoute;
    return Object.assign(
      cleanSsgRoute,
      output ? { entryPath: output } : {},
    ) as ModernRoute;
  });

  // all routes that need to be added and replaced
  const freshRoutes: ModernRoute[] = [];
  cleanSsgRoutes.forEach(ssgRoute => {
    const index = exist(ssgRoute, pageRoutes);

    if (index < 0) {
      // new route
      freshRoutes.push({ ...ssgRoute });
    } else {
      // overwrite original entry
      pageRoutes[index].entryPath = ssgRoute.entryPath;
    }
  });

  pageRoutes.push(...freshRoutes);
  return pageRoutes;
}
