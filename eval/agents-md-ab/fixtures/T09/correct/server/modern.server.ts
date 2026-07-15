import type { MiddlewareHandler } from 'hono';
import { defineServerConfig } from '@modern-js/server-runtime';

// v3 custom web server convention: server/modern.server.ts default-exports the
// defineServerConfig({...}) config with a middlewares array (Hono-style
// handlers). @modern-js/server-runtime is preinstalled in both templates.
const xEvalHeader: MiddlewareHandler = async (c, next) => {
  await next();
  c.res.headers.set('x-eval', '1');
};

export default defineServerConfig({
  middlewares: [
    {
      name: 'x-eval-header',
      handler: xEvalHeader,
    },
  ],
});
