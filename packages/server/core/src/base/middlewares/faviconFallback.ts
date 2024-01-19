import { Middleware } from '../types';

export const favionFallbackMiddleware: Middleware = async (c, next) => {
  if (c.req.path === '/favicon.ico') {
    return c.body(null, 204);
  } else {
    return next();
  }
};
