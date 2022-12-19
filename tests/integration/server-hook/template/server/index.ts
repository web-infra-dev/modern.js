import { AfterRenderHook } from '@modern-js/runtime/server';

export const afterRender: AfterRenderHook = (ctx, next) => {
  ctx.template.appendHead('<meta name="text-append" content="hello modern">');
  ctx.template.prependBody('<meta name="text-prepend" content="hello modern">');
  ctx.template.appendBody('<div id="append">appendBody</div>');
  ctx.template.prependBody('<div id="prepend">prependBody</div>');

  const html = ctx.template.get();
  ctx.template.set(`${html} set-extra`);
  next();
};
