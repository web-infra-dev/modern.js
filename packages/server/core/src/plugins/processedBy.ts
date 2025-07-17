import type { MiddlewareHandler, ServerPlugin } from '../types';

export const processedByPlugin = (): ServerPlugin => ({
  name: '@modern-js/plugin-processed',

  setup(api) {
    api.onPrepare(() => {
      const { middlewares } = api.getServerContext();

      middlewares.push({
        name: 'processed-by',
        handler: (async (c, next) => {
          await next();

          c.header('X-Processed-By', 'Modern.js');
        }) as MiddlewareHandler,
      });
    });
  },
});
