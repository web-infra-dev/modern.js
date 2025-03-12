import { hook } from '@modern-js/runtime/server';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (c, next) => {
    c.res.headers.set('x-bff-custom-middleware', '1');

    await next();
  });
});
