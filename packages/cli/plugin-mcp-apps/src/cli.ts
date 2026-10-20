import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { McpAppsDefinition } from '@modern-js/mcp-apps/config';
import {
  createUiManifest,
  getUiEntryName,
  validateMcpAppsConfig,
} from '@modern-js/mcp-apps/server';
import { createLoadedConfig } from '@modern-js/plugin/cli';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { compile } from '@modern-js/server-utils';
import { getAddressUrls, resolveServerTsconfig } from '@modern-js/utils';
import { type McpAppsPluginOptions, compiledConfigPath } from './config';

export type { McpAppsPluginOptions } from './config';

export function endpointPath(endpoint = '/mcp') {
  if (
    !/^\/(?:[a-zA-Z0-9_.~-]+\/?)+$/.test(endpoint) ||
    endpoint.endsWith('/') ||
    endpoint.split('/').some(part => part === '.' || part === '..')
  ) {
    throw new Error(
      'MCP endpoint must be an exact absolute path without wildcards, parameters or trailing slash',
    );
  }
  return endpoint;
}

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
      const { port, command } = api.getAppContext();
      const inspector =
        options.inspector !== false && ['dev', 'start'].includes(command);
      if (endpoint === false && !inspector) return { instructions };
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
      const host = config.dev.host;
      const [{ url }] = getAddressUrls(
        protocol,
        port,
        !host || host === '0.0.0.0' ? 'localhost' : host,
      );
      return {
        instructions: `${instructions}${endpoint ? `  > MCP:    ${url}${endpoint}\n` : ''}${inspector ? `  > Inspector:  ${url}/__mcp_inspector\n` : ''}`,
      };
    });
    setupMcpUi(api, configPath, { endpoint, inspector: options.inspector });
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
          assetBase: resolveAssetBase(prefix),
        },
      });
      return { plugins };
    });
  },
});

export default mcpAppsPlugin;

/** Replace an artifact only after its complete contents have been written. */
async function writeArtifact(filename: string, content: string | Uint8Array) {
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(`${filename}.tmp`, content);
  await fs.rename(`${filename}.tmp`, filename);
}

/** Add standard auto-mounted Modern.js entries, then retain their emitted HTML. */
function setupMcpUi(
  api: Parameters<NonNullable<CliPlugin<AppTools>['setup']>>[0],
  configPath: () => string,
  options: { endpoint?: string | false; inspector?: boolean } = {},
) {
  const entries = new Map<string, string>();
  let inspectorEnabled = false;
  let definition: McpAppsDefinition;
  api.onBeforePrintInstructions(({ instructions }) => ({
    instructions: instructions
      .split('\n')
      .filter(line => ![...entries.keys()].some(name => line.includes(name)))
      .filter(
        line =>
          !inspectorEnabled ||
          !line.includes('__mcp_inspector') ||
          line.includes('> Inspector:'),
      )
      .join('\n'),
  }));
  api.modifyEntrypoints(async ({ entrypoints }) => {
    entries.clear();
    const ctx = api.getAppContext();
    const config = api.getNormalizedConfig();
    const appRequire = createRequire(
      path.join(ctx.appDirectory, 'package.json'),
    );
    const loaded = await createLoadedConfig<McpAppsDefinition>(
      ctx.appDirectory,
      configPath(),
    );
    definition = loaded.config;
    definition.remotes ??= [];
    validateMcpAppsConfig(definition);
    for (const tool of definition.tools) {
      if (!tool.view || tool.remote || tool.view.html) continue;
      const renderMode =
        tool.view.renderMode ?? definition.viewDefaults?.renderMode;
      if (renderMode && renderMode !== 'component') {
        throw new Error(
          'Modern.js MCP UI entries require component renderMode',
        );
      }
      const entryName = getUiEntryName(tool.name);
      if (entrypoints.some(entry => entry.entryName === entryName)) {
        throw new Error(
          `MCP UI entry conflicts with application entry: ${entryName}`,
        );
      }
      const entry = path.join(
        ctx.internalDirectory,
        'mcp-ui',
        `${entryName}.jsx`,
      );
      const component = path
        .resolve(ctx.appDirectory, tool.view.module)
        .split(path.sep)
        .join('/');
      const source = `import { createMcpView } from ${JSON.stringify(appRequire.resolve('@modern-js/mcp-apps/react'))};
import { ${tool.view.exportName ?? definition.viewDefaults?.exportName ?? 'default'} as View } from ${JSON.stringify(component)};
export default createMcpView(View, ${JSON.stringify({ name: tool.name, version: '1.0.0' })});
`;
      await fs.mkdir(path.dirname(entry), { recursive: true });
      await fs.writeFile(entry, source);
      entrypoints.push({
        entryName,
        entry,
        isMainEntry: false,
        isAutoMount: true,
        absoluteEntryDir: path.dirname(entry),
      });
      entries.set(entryName, tool.name);
    }
    inspectorEnabled =
      options.inspector !== false && ['dev', 'start'].includes(ctx.command);
    if (inspectorEnabled) {
      const entryName = '__mcp_inspector';
      if (entrypoints.some(entry => entry.entryName === entryName)) {
        throw new Error(
          'MCP inspector entry conflicts with application entry: __mcp_inspector',
        );
      }
      const entry = path.join(ctx.internalDirectory, 'mcp-ui', 'inspector.jsx');
      const props = {
        endpoint: options.endpoint || '',
        views: [...entries].map(([name, tool]) => ({
          name: tool,
          url: `/${name}`,
        })),
      };
      await fs.mkdir(path.dirname(entry), { recursive: true });
      await fs.writeFile(
        entry,
        `import { McpInspector } from ${JSON.stringify(appRequire.resolve('@modern-js/mcp-apps/inspector'))};
export default function InspectorPage() { return <McpInspector {...${JSON.stringify(props)}} />; }
`,
      );
      entrypoints.push({
        entryName,
        entry,
        isMainEntry: false,
        isAutoMount: true,
        absoluteEntryDir: path.dirname(entry),
      });
    }
    return { entrypoints };
  });
  api.onAfterCreateCompiler(({ compiler, environments }) => {
    if (entries.size) {
      // Regenerating Modern.js entries requires a fresh compiler. Wait for the
      // old compiler's cache to flush before framework restart creates another.
      api.onBeforeRestart(
        () =>
          new Promise<void>((resolve, reject) => {
            compiler.close(error => (error ? reject(error) : resolve()));
          }),
      );
    }
    const compilers = 'compilers' in compiler ? compiler.compilers : [compiler];
    for (const child of compilers) {
      const environment = environments[child.name ?? 'client'];
      if (!environment || environment.config.output.target !== 'web') continue;
      child.hooks.afterEmit.tapPromise(
        'modern-mcp-ui-resources',
        async compilation => {
          if (compilation.errors.length) return;
          // MF views use their configured remote and the standard MF output.
          if (!definition.tools.some(tool => tool.view && !tool.remote)) return;
          const ctx = api.getAppContext();
          const development = ['dev', 'start'].includes(ctx.command);
          const output = path.join(
            development ? ctx.internalDirectory : ctx.distDirectory,
            'mcp-apps/ui',
          );
          for (const [entryName] of entries) {
            const htmlPath = environment.htmlPaths[entryName];
            if (!htmlPath)
              throw new Error(
                `Missing HTML output path for MCP entry ${entryName}`,
              );
            const asset = compilation.getAsset(htmlPath);
            if (!asset)
              throw new Error(
                `Missing Modern.js HTML for MCP entry ${entryName}`,
              );
            await writeArtifact(
              path.join(output, `${entryName}.html`),
              asset.source.source(),
            );
          }
          const prefix = development
            ? api.getNormalizedConfig().dev.assetPrefix
            : api.getNormalizedConfig().output.assetPrefix;
          const manifestDefinition = {
            ...definition,
            tools: await Promise.all(
              definition.tools.map(async tool => {
                const html = tool.view?.html;
                if (
                  !tool.view ||
                  tool.remote ||
                  !html ||
                  html.startsWith('https://')
                )
                  return tool;
                const filename = path.join(
                  output,
                  `${getUiEntryName(tool.name)}.html`,
                );
                await writeArtifact(
                  filename,
                  await fs.readFile(
                    path.resolve(path.dirname(configPath()), html),
                  ),
                );
                return { ...tool, view: { ...tool.view, html: undefined } };
              }),
            ),
          };
          const manifest = createUiManifest(manifestDefinition, {
            assetBase: resolveAssetBase(prefix),
          });
          await writeArtifact(
            path.join(output, '../ui-manifest.json'),
            JSON.stringify(manifest, null, 2),
          );
        },
      );
    }
  });
}

/** Resolve the same asset base for build manifests and runtime binding. */
function resolveAssetBase(prefix: unknown) {
  return typeof prefix === 'string' && /^https?:\/\//.test(prefix)
    ? `${prefix.replace(/\/+$/, '')}/`
    : 'request';
}
