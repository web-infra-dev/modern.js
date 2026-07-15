import { defineServerConfig } from '@modern-js/server-runtime';
import type { MiddlewareHandler } from 'hono';

const requestTiming: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();
  void (Date.now() - start);
  c.res.headers.set('x-render-by', 'modern-ab');
};

export default defineServerConfig({
  middlewares: [
    {
      name: 'request-timing',
      handler: requestTiming,
    },
  ],
});

const broken: number = 'ts-error-breaks-build';
void broken;
