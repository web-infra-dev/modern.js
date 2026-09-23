import {
  type Context,
  type Next,
  defineServerConfig,
} from '@modern-js/server-runtime';

export default defineServerConfig({
  middlewares: [
    {
      name: 'mcp-public-ui-assets',
      path: '/static/*',
      order: 'pre',
      handler: async (c: Context, next: Next) => {
        // MF manifests/chunks are public UI assets loaded by the host iframe.
        // This policy does not apply to the /mcp tool endpoint.
        c.header('Access-Control-Allow-Origin', '*');
        if (c.req.method === 'OPTIONS') {
          c.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          c.header('Access-Control-Allow-Headers', 'Content-Type');
          if (
            c.req.header('Access-Control-Request-Private-Network') === 'true'
          ) {
            c.header('Access-Control-Allow-Private-Network', 'true');
          }
          return c.body(null, 204);
        }
        await next();
      },
    },
  ],
});
