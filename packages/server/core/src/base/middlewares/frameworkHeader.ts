import { Middleware } from '../../core/server';

export const processedBy: Middleware = async (ctx, next) => {
  await next();
  ctx.header('X-Processed-By', 'Modern.js');
};
