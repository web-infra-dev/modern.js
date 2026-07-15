// WRONG: Modern.js v2 custom server convention (server/index.ts + hooks)
export const middleware = (ctx: any, next: any) => {
  ctx.res.setHeader('x-eval', '1');
  return next();
};
