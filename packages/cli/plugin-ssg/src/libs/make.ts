import path from 'path';
import { ModernRoute } from '@modern-js/server';
import normalize from 'normalize-path';
import { compile } from '../server/prerender';
import { RouteOptions, SsgRoute } from '../types';

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
  route: string | RouteOptions,
  headers: Record<string, any> = {},
): SsgRoute {
  const { urlPath, entryPath } = baseRoute;

  if (typeof route === 'string') {
    return {
      ...baseRoute,
      urlPath: normalize(`${urlPath}${route}`),
      headers,
      output: path.join(entryPath, `..${route}`),
    };
  } else {
    return {
      ...baseRoute,
      urlPath: normalize(`${urlPath}${route.url}`),
      headers: { ...headers, ...route.headers },
      output: route.output || path.join(entryPath, `..${route.url}`),
    };
  }
}
