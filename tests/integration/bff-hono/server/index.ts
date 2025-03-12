import type { AfterRenderHook, Middleware } from '@modern-js/runtime/server';
import { useContext } from '@modern-js/runtime/server';

export const middleware: Middleware = async (context, next) => {
  console.info(`user access url:${context.request.pathname}`);
  const c = useContext();

  if (c.req.path.startsWith('/bff-hono')) {
    c.res.headers.set('x-bff-web-server-middleware', '1');
  }
  await next();
};

export const afterRender: AfterRenderHook = (context, next) => {
  context.template.appendBody('EdenX Server');
  next();
};
