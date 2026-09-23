import path from 'node:path';
import { mcpApps } from '@modern-js/mcp-apps/hono';
import { createArtifactHandler } from '@modern-js/mcp-apps/server';
import type { ServerPlugin } from '@modern-js/server-core';
import { type McpAppsServerOptions, endpointPath } from './options';
export type { McpAppsServerOptions } from './options';
export { createArtifactHandler } from '@modern-js/mcp-apps/server';

export default function mcpAppsServerPlugin(
  options: McpAppsServerOptions = {},
): ServerPlugin {
  const endpoint = endpointPath(options.endpoint);
  return {
    name: '@modern-js/plugin-mcp-apps/server-plugin',
    setup(api) {
      let handler: ReturnType<typeof createArtifactHandler>;
      api.onPrepare(() => {
        const ctx = api.getServerContext();
        const development =
          options.development ?? process.env.NODE_ENV === 'development';
        const base = development ? ctx.appDirectory : ctx.distDirectory;
        if (!base)
          throw new Error(
            'MCP Apps requires a server application/artifact directory',
          );
        const entry = path.resolve(
          base,
          development && options.devEntry
            ? options.devEntry
            : (options.entry ?? 'mcp-apps/mcp_apps.mjs'),
        );
        handler = createArtifactHandler(entry, {
          development,
          serverInfo: options.serverInfo,
        });
        ctx.middlewares.push({
          name: 'mcp-apps',
          path: endpoint,
          method: 'all',
          order: 'post',
          before: ['bind-bff', 'render'],
          handler: mcpApps({ handler, endpoint }),
        });
      });
      api.onReset(({ event }) => {
        if (event.type === 'file-change') handler?.reset();
      });
    },
  };
}
