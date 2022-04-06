import path from 'path';
import { ServerRoute as ModernRoute } from '@modern-js/types';
import normalize from 'normalize-path';
import { compile } from '../server/prerender';
import { SSGRouteOptions, SsgRoute } from '../types';

export function makeRender(
  ssgRoutes: SsgRoute[],
  render: ReturnType<typeof compile>,
  port: number,
): Promise<string>[] {
  return ssgRoutes.map((ssgRoute: SsgRoute) =>
    render({
      url: ssgRoute.urlPath,
      headers: { host: `localhost:${port}`, ...ssgRoute.headers },
      connection: {},
    }),
  );
}

export function makeRoute(
  baseRoute: ModernRoute,
  route: string | SSGRouteOptions,
  headers: Record<string, any> = {},
): SsgRoute {
  const { urlPath, entryPath } = baseRoute;

  if (typeof route === 'string') {
    return {
      ...baseRoute,
      urlPath: normalize(`${urlPath}${route}`) || '/',
      headers,
      output: path.join(entryPath, `..${route === '/' ? '' : route}`),
    };
  } else {
    return {
      ...baseRoute,
      urlPath: normalize(`${urlPath}${route.url}`) || '/',
      headers: { ...headers, ...route.headers },
      output: route.output
        ? path.normalize(route.output)
        : path.join(entryPath, `..${route.url === '/' ? '' : route.url}`),
    };
  }
}
