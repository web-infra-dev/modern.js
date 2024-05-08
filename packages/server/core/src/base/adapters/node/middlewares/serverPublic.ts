import path from 'path';
import { ServerRoute } from '@modern-js/types';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { getMimeType } from 'hono/utils/mime';
import { HonoRequest, Middleware } from '../../../../core/server';
import { sortRoutes } from '../../../utils';

export type PublicMiddlwareOptions = {
  pwd: string;
  routes: ServerRoute[];
};

export function createPublicMiddleware({
  pwd,
  routes,
}: PublicMiddlwareOptions): Middleware {
  return async (c, next) => {
    const route = matchRoute(c.req, routes);

    if (route) {
      const { entryPath } = route;
      const filename = path.join(pwd, entryPath);
      const data = await fileReader.readFile(filename, 'buffer');
      const mimeType = getMimeType(filename);

      if (data !== null) {
        if (mimeType) {
          c.header('Content-Type', mimeType);
        }

        Object.entries(route.responseHeaders || {}).forEach(([k, v]) => {
          c.header(k, v as string);
        });

        return c.body(data, 200);
      }
    }

    return await next();
  };
}

function matchRoute(req: HonoRequest, routes: ServerRoute[]) {
  for (const route of routes.sort(sortRoutes)) {
    if (
      !route.isSSR &&
      !route.isApi &&
      route.entryPath.startsWith('public') &&
      req.path.startsWith(route.urlPath)
    ) {
      return route;
    }
  }
  return undefined;
}
