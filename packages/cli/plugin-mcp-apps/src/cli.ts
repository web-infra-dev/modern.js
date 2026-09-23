import path from 'node:path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { compileMcpApps } from '@modern-js/mcp-apps/build';
import { chokidar, logger } from '@modern-js/utils';
import type { McpAppsPluginOptions } from './options';

export type { McpAppsPluginOptions } from './options';

export const mcpAppsPlugin = (
  options: McpAppsPluginOptions = {},
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-mcp-apps',
  required: ['@modern-js/plugin-bff'],
  setup(api) {
    let dependencies = new Set<string>();
    let watcher: ReturnType<typeof chokidar.watch> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: Promise<unknown> = Promise.resolve();
    let closed = false;
    let rebuildFailed = false;
    const paths = () => {
      const ctx = api.getAppContext();
      return {
        root: ctx.appDirectory,
        source: path.resolve(ctx.appDirectory, options.config ?? 'mcp_apps.ts'),
        devOut: path.join(ctx.internalDirectory, 'mcp-apps'),
        prodOut: path.join(ctx.distDirectory, 'mcp-apps'),
      };
    };
    const compile = async (dev: boolean) => {
      const { root, source, devOut, prodOut } = paths();
      const result = await compileMcpApps({
        configPath: source,
        outDir: dev ? devOut : prodOut,
        tsconfig: options.tsconfig
          ? path.resolve(root, options.tsconfig)
          : undefined,
        alias: options.alias,
        development: dev,
      });
      dependencies = new Set(
        result.dependencies.map(file => path.resolve(file)),
      );
      rebuildFailed = false;
      if (dev) watcher?.add([...dependencies]);
      if (dev) logger.info('[MCP Apps] definition and handlers ready');
    };
    const close = async () => {
      closed = true;
      clearTimeout(timer);
      await watcher?.close();
      await pending;
    };
    api.onBeforeExit(close);
    api.onBeforeRestart(close);
    api.onBeforeDev(async () => {
      closed = false;
      await compile(true);
      const { root, devOut, prodOut } = paths();
      // Own only MCP recompilation. Do not subscribe these files to app-tools'
      // full process restart watcher, or API/UI changes would race that restart.
      watcher = chokidar.watch([root, ...dependencies], {
        ignoreInitial: true,
        ignored: [
          /[\\/]node_modules(?:[\\/]|$)/,
          /[\\/]\.git(?:[\\/]|$)/,
          path.join(root, '.output'),
          devOut,
          prodOut,
          path.dirname(prodOut),
        ],
      });
      watcher.on('error', error =>
        logger.error('[MCP Apps] watcher failed', error),
      );
      watcher.on('all', (event, file) => {
        if (
          closed ||
          (!dependencies.has(path.resolve(file)) &&
            !(rebuildFailed && event === 'add'))
        )
          return;
        if (
          !dependencies.has(path.resolve(file)) &&
          !/\.(?:[cm]?[jt]sx?|json)$/.test(file)
        )
          return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          pending = pending
            .then(async () => {
              if (!closed) await compile(true);
            })
            .catch(error => {
              rebuildFailed = true;
              logger.error(
                '[MCP Apps] rebuild failed; keeping last successful build',
                error,
              );
            });
        }, 60);
      });
    });
    api.onAfterBuild(() => compile(false));
    api._internalServerPlugins(({ plugins }) => {
      const { root, devOut } = paths();
      plugins.push({
        name: '@modern-js/plugin-mcp-apps/bff-runtime',
        options: {
          development: ['dev', 'start'].includes(api.getAppContext().command),
          devEntry: path
            .relative(root, path.join(devOut, 'mcp_apps.mjs'))
            .split(path.sep)
            .join('/'),
          entry: 'mcp-apps/mcp_apps.mjs',
        },
      });
      return { plugins };
    });
  },
});

export default mcpAppsPlugin;
