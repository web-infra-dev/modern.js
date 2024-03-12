import type { Middleware } from '../../core/server';

export const favionFallbackMiddleware: Middleware = async (c, next) => {
  if (c.req.path === '/favicon.ico') {
    return c.body(null, 204);
  } else {
    return next();
  }
};
