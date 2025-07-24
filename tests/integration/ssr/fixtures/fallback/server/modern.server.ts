import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';

const timing: MiddlewareHandler = async (c, next) => {
  const fallback = c.req.query('fallback');
  if (fallback) {
    c.set('forceCSR', '1');
  }
  await next();
};

export default defineServerConfig({
  renderMiddlewares: [
    {
      name: 'render-timing',
      handler: timing,
    },
  ],
});
