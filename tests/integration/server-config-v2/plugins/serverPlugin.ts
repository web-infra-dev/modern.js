import type { ServerPluginLegacy } from '@modern-js/runtime/server';

export default (): ServerPluginLegacy => ({
  name: 'serverPluginV2',
  setup(api) {
    return {
      prepare(serverConfig) {
        const { middlewares, renderMiddlewares } = api.useAppContext();

        middlewares?.push({
          name: 'server-plugin-middleware',
          handler: async (c, next) => {
            const start = Date.now();

            await next();

            const end = Date.now();

            c.res.headers.set('x-plugin-middleware', `dur=${end - start}`);
          },
        });

        renderMiddlewares?.push({
          name: 'server-plugin-render-middleware',
          handler: async (c, next) => {
            const start = Date.now();

            await next();

            const end = Date.now();

            c.res.headers.set(
              'x-plugin-render-middleware',
              `dur=${end - start}`,
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

        return serverConfig;
      },
    };
  },
});
