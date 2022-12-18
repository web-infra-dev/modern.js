import { Middleware } from '@modern-js/runtime/server';

export const middleware: Middleware = (ctx, next) => {
  throw new Error(1);
};
