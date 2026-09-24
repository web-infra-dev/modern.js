import path from 'node:path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import type { McpAppsPluginOptions } from './options';
import { setupMcpUi } from './ui';

export type { McpAppsPluginOptions } from './options';

export const mcpAppsPlugin = (
  options: McpAppsPluginOptions = {},
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-mcp-apps',
  required: ['@modern-js/plugin-bff'],
  post: ['@modern-js/runtime'],
  setup(api) {
    const configPath = () =>
      path.resolve(
        api.getAppContext().appDirectory,
        options.config ?? 'api/mcp_apps.ts',
      );
    setupMcpUi(api, configPath);
    api._internalServerPlugins(({ plugins }) => {
      const ctx = api.getAppContext();
      const config = api.getNormalizedConfig();
      const development = ['dev', 'start'].includes(ctx.command);
      const prefix = development
        ? config.dev.assetPrefix
        : config.output.assetPrefix;
      plugins.push({
        name: '@modern-js/plugin-mcp-apps/bff-runtime',
        options: {
          development,
          config: options.config ?? 'api/mcp_apps.ts',
          resourceDirectory: development
            ? path
                .relative(
                  ctx.appDirectory,
                  path.join(ctx.internalDirectory, 'mcp-apps/ui'),
                )
                .split(path.sep)
                .join('/')
            : 'mcp-apps/ui',
          assetBase:
            typeof prefix === 'string' && /^https?:\/\//.test(prefix)
              ? `${prefix.replace(/\/+$/, '')}/`
              : 'request',
        },
      });
      return { plugins };
    });
  },
});

export default mcpAppsPlugin;
