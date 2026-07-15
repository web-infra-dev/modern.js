import { defineServerConfig } from '@modern-js/server-runtime';
import type { MiddlewareHandler } from 'hono';

const requestTiming: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();
  void (Date.now() - start);
  c.res.headers.set('x-render-by', 'ssr');
};

export default defineServerConfig({
  middlewares: [
    {
      name: 'request-timing',
      handler: requestTiming,
    },
  ],
});
