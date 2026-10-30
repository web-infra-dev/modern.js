import type { ServerRoute as ModernRoute } from '@modern-js/types';
import normalize from 'normalize-path';
import type { SsgRoute } from '../types';

export function exist(route: ModernRoute, pageRoutes: ModernRoute[]): number {
  return pageRoutes.slice().findIndex(pageRoute => {
    const urlEqual = normalize(pageRoute.urlPath) === normalize(route.urlPath);
    const entryEqual = pageRoute.entryName === route.entryName;
    if (urlEqual && entryEqual && pageRoute.isSSG === route.isSSG) {
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
      { isSSG: true },
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
      // Replace only an existing prerendered route, keeping the entry fallback.
      pageRoutes[index] = ssgRoute;
    }
  });

  pageRoutes.push(...freshRoutes);
  return pageRoutes;
}
