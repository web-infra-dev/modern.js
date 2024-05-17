import { Middleware } from '@modern-js/runtime/server';

export const middleware: Middleware[] = [
  (ctx, next) => {
    const { res } = ctx.source;
    res.setHeader('x-index-middleware', 'true');
    next();
  },

  (ctx, next) => {
    const { response, request } = ctx;
    if (request.url.startsWith('/home')) {
      response.set('x-index-name', 'home');
    }

    next();
  },

  (ctx, next) => {
    const { response, request } = ctx;

    if (request.url.startsWith('/redirect')) {
      response.set('Location', '/');
      response.status(302);
    }

    next();
  },
];
