import type { MiddlewareHandler, ServerPlugin } from '../types';

export const faviconPlugin = (): ServerPlugin => ({
  name: '@modern-js/plugin-favicon',

  setup(api) {
    api.onPrepare(() => {
      const { middlewares } = api.getServerContext();

      middlewares.push({
        name: 'favicon-fallback',
        path: '/favicon.ico',
        handler: (async (c, _next) => {
          return c.body(null, 204);
        }) as MiddlewareHandler,
      });
    });
  },
});
