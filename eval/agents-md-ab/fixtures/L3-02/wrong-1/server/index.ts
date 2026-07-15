import type { NextFunction } from '@modern-js/types';

export const middleware = () => async (ctx: any, next: NextFunction) => {
  await next();
  ctx.res.setHeader('x-render-by', 'modern-ab');
};
