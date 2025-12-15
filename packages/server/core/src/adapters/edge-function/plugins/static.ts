import path from 'path';
import type { Middleware, ServerPlugin } from '../../../types';

export const serverStaticPlugin = (files: string[]): ServerPlugin => ({
  name: '@modern-js/plugin-server-static',

  setup(api) {
    api.onPrepare(() => {
      const { middlewares } = api.getServerContext();

      const serverStaticMiddleware = createStaticMiddleware(files);

      middlewares.push({
        name: 'server-static',

        handler: serverStaticMiddleware,
      });
    });
  },
});

export function createStaticMiddleware(files: string[]): Middleware {
  return async (c, next) => {
    // If page route hit, we should skip static middleware for performance
    const pageRoute = c.get('route');
    const pathname = c.req.path;
    if (pageRoute && path.extname(pathname) === '') {
      return next();
    }

    if (files.includes(pathname)) {
      return (fetch as any)(c.req.raw, {
        headers: c.req.raw.headers,
      });
    }

    return next();
  };
}
