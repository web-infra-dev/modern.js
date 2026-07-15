import type { MiddlewareHandler } from 'hono';

// v3 custom web server convention: server/modern.server.ts default-exports a
// server config with a middlewares array (Hono-style handlers).
// NOTE: the official helper `defineServerConfig` lives in
// '@modern-js/server-runtime', which is not installed in this template, so we
// export the config object shape directly (identical semantics).
const xEvalHeader: MiddlewareHandler = async (c, next) => {
  await next();
  c.res.headers.set('x-eval', '1');
};

export default {
  middlewares: [
    {
      name: 'x-eval-header',
      handler: xEvalHeader,
    },
  ],
};
