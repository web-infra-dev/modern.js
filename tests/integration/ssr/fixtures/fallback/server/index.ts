import type { Middleware } from '@modern-js/runtime/server';

export const middleware: Middleware = (ctx, next) => {
  const { request } = ctx;

  if (request.query.fallback) {
    request.headers['x-modern-ssr-fallback'] = '1';
  }

  next();
};
