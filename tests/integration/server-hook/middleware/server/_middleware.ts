import { Middleware } from '@modern-js/runtime/server';

export const middleware: Middleware[] = [
  (ctx, next) => {
    if (ctx.request.url === '/') {
      const { res } = ctx.source;
      res.setHeader('x-unstable-middleware', 'true');
    }

    next();
  },
  (ctx, next) => {
    if (ctx.request.url === '/') {
      const { res } = ctx.source;

      res.end('hello modern');
    }

    next();
  },
];
