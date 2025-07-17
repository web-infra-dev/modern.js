import { defineConfig } from '@modern-js/app-tools/server';
import type {
  MiddlewareHandler,
  ServerPlugin,
} from '@modern-js/server-runtime';

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
        api.onPrepare(() => {
          const { middlewares } = api.getServerContext();

          middlewares?.push({
            name: 'server-plugin-middleware',
            handler: (async (c, next) => {
              c.res.headers.set('x-render-middleware-plugin', 'ok');

              await next();
            }) as MiddlewareHandler,
          });
        });
      },
    } as ServerPlugin,
  ],
});
