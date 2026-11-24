import { defineServerConfig } from '@modern-js/server-runtime';

export default defineServerConfig({
  middlewares: [
    {
      name: 'mcp-public-static-cors',
      path: '/static/*',
      order: 'pre',
      handler: async (c, next) => {
        await next();
        // Sandboxed MCP cards fetch public MF assets from an opaque origin.
        c.header('Access-Control-Allow-Origin', '*');
      },
    },
  ],
});
