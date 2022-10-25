import type { AfterRenderHook } from '@modern-js/runtime/server';

export const afterRender: AfterRenderHook = (ctx, next) => {
  ctx.template.prependBody('bytedance');
  next();
};
