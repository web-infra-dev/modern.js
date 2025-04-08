import { useHonoContext } from '@modern-js/runtime/hono';
import type { AfterRenderHook, Middleware } from '@modern-js/runtime/server';

export const middleware: Middleware = async (context, next) => {
  const c = useHonoContext();

  if (c.req.path.startsWith('/bff-api')) {
    c.res.headers.set('x-bff-web-server-middleware', '1');
  }
  await next();
};

export const afterRender: AfterRenderHook = (context, next) => {
  context.template.appendBody('EdenX Server');
  next();
};
