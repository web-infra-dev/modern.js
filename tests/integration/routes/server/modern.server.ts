import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';

const renderTiming: MiddlewareHandler = async (c, next) => {
  if (c.req.path === '/rewrite') {
    c.rewriteByEntry('one');
  }

  await next();
};

export default defineServerConfig({
  renderMiddlewares: [
    {
      name: 'render-timing',
      handler: renderTiming,
    },
  ],
});
