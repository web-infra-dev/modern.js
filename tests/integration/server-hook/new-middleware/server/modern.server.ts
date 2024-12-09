import { defineConfig } from '@modern-js/app-tools/server';

export default defineConfig({
  render: {
    middleware: [
      async (c, next) => {
        c.response.headers.set('x-render-middleware-config', 'ok');

        await next();
      },
    ],
  },
  plugins: [
    {
      name: 'custom-plugin-in-config',
      setup: () => {
        return {
          config: async config => {
            if (!config.render) {
              config.render = {};
            }
            config.render.middleware ||= [];
            config.render.middleware.push(async (c, next) => {
              c.response.headers.set('x-render-middleware-plugin', 'ok');
              await next();
            });

            return config;
          },
        };
      },
    },
  ],
});
