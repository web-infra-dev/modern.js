import { Middleware } from '@modern-js/runtime/server';

export const middleware: Middleware = (ctx, next) => {
  const { res } = ctx.source;
  res.setHeader('x-index-middleware', 'true');
  next();
};
