import type { MiddlewareHandler } from 'hono';

const handler: MiddlewareHandler = async (c, next) => {
  await next();
  c.res.headers.set('x-evall', '1'); // header name typo
};

export default {
  middlewares: [{ name: 'header-mw', handler }],
};
