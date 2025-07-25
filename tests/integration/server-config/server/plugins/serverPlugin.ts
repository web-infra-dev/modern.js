import type {
  MiddlewareHandler,
  ServerPlugin,
} from '@modern-js/server-runtime';

export default (): ServerPlugin => ({
  name: 'serverPlugin',
  setup(api) {
    api.onPrepare(() => {
      const { middlewares, renderMiddlewares } = api.getServerContext();

      middlewares?.push({
        name: 'server-plugin-middleware',
        handler: (async (c, next) => {
          const start = Date.now();

          await next();

          const end = Date.now();

          c.res.headers.set(
            'x-plugin-middleware',
            `request; dur=${end - start}`,
          );
        }) as MiddlewareHandler,
      });

      renderMiddlewares?.push({
        name: 'server-plugin-render-middleware',
        handler: async (c, next) => {
          const start = Date.now();

          await next();

          const end = Date.now();

          c.res.headers.set(
            'x-plugin-render-middleware',
            `plugin; dur=${end - start}`,
          );

          const { res } = c;

          const text = await res.text();

          const newText = text.replace('<body>', '<body> <h3>bytedance</h3>');

          c.res = c.body(newText, {
            status: res.status,
            headers: res.headers,
          });
        },
      });
    });
  },
});
