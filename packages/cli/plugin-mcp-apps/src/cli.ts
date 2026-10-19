import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { compile } from '@modern-js/server-utils';
import { getAddressUrls, resolveServerTsconfig } from '@modern-js/utils';
import { type McpAppsPluginOptions, endpointPath } from './options';
import { compiledConfigPath } from './shared';
import { setupMcpUi } from './ui';

export type { McpAppsPluginOptions } from './options';

export const mcpAppsPlugin = (
  options: McpAppsPluginOptions = {},
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-mcp-apps',
  required: options.mode === 'ui-only' ? [] : ['@modern-js/plugin-bff'],
  post: ['@modern-js/runtime'],
  setup(api) {
    if (options.mode === 'ui-only') {
      api.modifyResolvedConfig(config => {
        config.source.disableDefaultEntries = true;
        return config;
      });
    }
    const configPath = () =>
      path.resolve(
        api.getAppContext().appDirectory,
        options.config ?? 'mcp_apps.ts',
      );
    const endpoint =
      options.mode === 'ui-only' || options.endpoint === false
        ? false
        : endpointPath(options.endpoint);
    api.onBeforePrintInstructions(({ instructions }) => {
      if (endpoint === false) return { instructions };
      const { port } = api.getAppContext();
      if (port === undefined) return { instructions };
      const config = api.getNormalizedConfig();
      const devServer = config.tools.devServer;
      const protocol =
        config.dev.https ||
        (typeof devServer === 'object' &&
          'https' in devServer &&
          devServer.https)
          ? 'https'
          : 'http';
      const addresses = getAddressUrls(protocol, port, config.dev.host);
      return {
        instructions: `${instructions}${addresses
          .map(({ label, url }) => `  > MCP ${label}${url}${endpoint}\n`)
          .join('')}`,
      };
    });
    setupMcpUi(api, configPath);
    api.addWatchFiles(() => [configPath()]);
    api.onAfterBuild(async () => {
      if (endpoint === false) return;
      const ctx = api.getAppContext();
      const config = api.getNormalizedConfig();
      const tsconfigPath = path.join(
        ctx.internalDirectory,
        'mcp-apps/tsconfig.server.json',
      );
      await fs.mkdir(path.dirname(tsconfigPath), { recursive: true });
      await fs.writeFile(
        tsconfigPath,
        JSON.stringify({
          extends: resolveServerTsconfig(
            ctx.appDirectory,
            config.server.tsconfigPath,
          ),
          files: [configPath()],
          include: [],
          compilerOptions: { noEmit: false },
        }),
      );
      await compile(
        ctx.appDirectory,
        {
          server: config.server,
          alias: ([] as unknown[]).concat(
            config.source.alias ?? [],
            config.resolve.alias ?? [],
          ) as unknown as Parameters<typeof compile>[1]['alias'],
        },
        {
          sourceDirs: [configPath()],
          distDir: ctx.distDirectory,
          tsconfigPath,
          moduleType: ctx.moduleType,
          throwErrorInsteadOfExit: true,
        },
      );
      await fs.access(
        path.resolve(
          ctx.distDirectory,
          compiledConfigPath(options.config ?? 'mcp_apps.ts'),
        ),
      );
    });
    if (options.mode === 'ui-only') return;
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
          endpoint,
          config: options.config ?? 'mcp_apps.ts',
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
