import { defineServerConfig } from '@modern-js/server-runtime';

export default defineServerConfig({
  middlewares: [
    {
      name: 'public-mf-assets-cors',
      path: '/static/*',
      order: 'pre',
      handler: async (c, next) => {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) return next();
        // MF manifests and chunks are public assets loaded by cross-origin cards.
        c.header('Access-Control-Allow-Origin', '*');
        if (c.req.method === 'OPTIONS') {
          c.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          c.header('Access-Control-Allow-Headers', 'Content-Type');
          return c.body(null, 204);
        }
        await next();
      },
    },
  ],
});
