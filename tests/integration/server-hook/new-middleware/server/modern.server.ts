import { defineConfig } from '@modern-js/app-tools/server';
import type {
  MiddlewareHandler,
  ServerPluginLegacy,
} from '@modern-js/runtime/server';

const requestTiming: MiddlewareHandler = async (c, next) => {
  c.res.headers.set('x-render-middleware-config', 'ok');

  await next();
};

export default defineConfig({
  middlewares: [
    {
      name: 'request-header-middleware',
      handler: requestTiming,
    },
  ],
  plugins: [
    {
      name: 'custom-plugin-in-config',
      setup: api => {
        return {
          prepare(serverConfig) {
            const { middlewares } = api.useAppContext();

            middlewares?.push({
              name: 'server-plugin-middleware',
              handler: async (c, next) => {
                c.res.headers.set('x-render-middleware-plugin', 'ok');

                await next();
              },
            });

            return serverConfig;
          },
        };
      },
    } as ServerPluginLegacy,
  ],
});
