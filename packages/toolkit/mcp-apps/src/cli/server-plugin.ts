import path from 'node:path';
import type { Context, Next, ServerPlugin } from '@modern-js/server-runtime';

export interface McpAppsServerOptions {
  developmentManifest?: string;
}

export default (options: McpAppsServerOptions = {}): ServerPlugin => ({
  name: '@modern-js/mcp-apps/server-plugin',
  setup(api) {
    api.onPrepare(() => {
      const { middlewares, distDirectory } = api.getServerContext();
      const uiOptions = options.developmentManifest
        ? {
            manifest: options.developmentManifest,
            mode: 'development' as const,
          }
        : {
            manifest: path.join(distDirectory!, 'mcp-apps/ui-manifest.json'),
            mode: 'production' as const,
          };
      middlewares.push({
        name: 'mcp-apps-context',
        before: ['bind-bff', 'hono-bff-api'],
        handler: async (context: Context, next: Next) => {
          context.set('locals', {
            ...context.get('locals'),
            modernMcpApps: uiOptions,
          });
          await next();
        },
      });
    });
  },
});
