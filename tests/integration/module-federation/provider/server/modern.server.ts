import { defineServerConfig } from '@modern-js/server-runtime';
const hostOrigin = `http://localhost:${JSON.parse(process.env.MF_LAB_PORTS || '{}').host || 4300}`;

export default defineServerConfig({
  middlewares: [
    {
      name: 'weather-route-loader-cors',
      order: 'pre',
      handler: async (context, next) => {
        if (
          context.req.query('__loader') &&
          context.req.header('Origin') === hostOrigin
        ) {
          context.header('Access-Control-Allow-Origin', hostOrigin);
          context.header('Vary', 'Origin');
        }
        await next();
      },
    },
  ],
});
