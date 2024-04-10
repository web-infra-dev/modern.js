import { AfterRenderHook } from '@modern-js/runtime/server';

export const afterRender: AfterRenderHook = (ctx, next) => {
  const { cookies, pathname, query, host, headers } = ctx.request;
  const result = {
    pathname,
    name: query.name,
    host,
    headers,
    age: `${cookies.get('age')}yearold`,
  };

  ctx.template.appendBody(`<div id='append'>${JSON.stringify(result)}</div>`);
  next();
};
