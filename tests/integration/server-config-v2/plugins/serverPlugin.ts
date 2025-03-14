import type { ServerPluginLegacy } from '@modern-js/server-core';

export default (): ServerPluginLegacy => ({
  name: 'serverPlugin1',
  setup(api) {
    return {
      prepare(serverConfig) {
        const { middlewares, renderMiddlewares } = api.useAppContext();

        middlewares?.push({
          name: 'server-plugin-middleware',
          handler: async (c, next) => {
            const start = Date.now();
            console.log('request timing in plugin', start);

            await next();

            const end = Date.now();

            console.log('request timing in plugin', end);
          },
        });

        renderMiddlewares?.push({
          name: 'server-plugin-render-middleware',
          handler: async (c, next) => {
            const start = Date.now();
            console.log('render timing in plugin', start);

            await next();

            const end = Date.now();

            console.log('render timing in plugin', end);
          },
        });

        return serverConfig;
      },
    };
  },
});
