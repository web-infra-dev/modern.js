import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import type { McpAppsDefinition } from '@modern-js/mcp-apps/config';
import { createUiManifest, getUiEntryName } from '@modern-js/mcp-apps/server';
import { createLoadedConfig } from '@modern-js/plugin/cli';
import { MF_ARTIFACTS, localRemoteNames, mfArtifact } from './mf';

/** Add standard auto-mounted Modern.js entries, then retain their emitted HTML. */
export function setupMcpUi(
  api: Parameters<NonNullable<CliPlugin<AppTools>['setup']>>[0],
  configPath: () => string,
  options: { endpoint?: string | false; debug?: boolean } = {},
) {
  const entries = new Map<string, string>();
  let localRemotes: string[] = [];
  let debugEnabled = false;
  let definition: McpAppsDefinition;
  api.onBeforePrintInstructions(({ instructions }) => ({
    instructions: instructions
      .split('\n')
      .filter(line => ![...entries.keys()].some(name => line.includes(name)))
      .filter(
        line =>
          !debugEnabled ||
          !line.includes('__mcp_debug') ||
          line.includes('> Debug:'),
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
    localRemotes = localRemoteNames(definition);
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
    debugEnabled =
      options.debug !== false && ['dev', 'start'].includes(ctx.command);
    if (debugEnabled) {
      const entryName = '__mcp_debug';
      if (entrypoints.some(entry => entry.entryName === entryName)) {
        throw new Error(
          'MCP debugger entry conflicts with application entry: __mcp_debug',
        );
      }
      const entry = path.join(ctx.internalDirectory, 'mcp-ui', 'debug.jsx');
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
        `import { McpDebugger } from ${JSON.stringify(appRequire.resolve('@modern-js/mcp-apps/debug'))};
export default function DebugPage() { return <McpDebugger {...${JSON.stringify(props)}} />; }
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
          const ctx = api.getAppContext();
          const development = ['dev', 'start'].includes(ctx.command);
          const output = path.join(
            development ? ctx.internalDirectory : ctx.distDirectory,
            'mcp-apps/ui',
          );
          if (localRemotes.length) {
            const artifacts = compilation.getAssets().flatMap(asset => {
              if (!asset.name.endsWith('.json')) return [];
              const artifact = mfArtifact(
                asset.name,
                asset.source.source().toString(),
              );
              return artifact && localRemotes.includes(artifact.name)
                ? [artifact]
                : [];
            });
            for (const name of localRemotes) {
              if (artifacts.filter(item => item.name === name).length !== 1) {
                throw new Error(
                  `Expected one emitted MF manifest for MCP remote "${name}"`,
                );
              }
            }
            await fs.mkdir(output, { recursive: true });
            const target = path.join(output, MF_ARTIFACTS);
            await fs.writeFile(`${target}.tmp`, JSON.stringify(artifacts));
            await fs.rename(`${target}.tmp`, target);
          }
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
            await fs.mkdir(output, { recursive: true });
            const filename = path.join(output, `${entryName}.html`);
            await fs.writeFile(`${filename}.tmp`, asset.source.source());
            await fs.rename(`${filename}.tmp`, filename);
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
                await fs.mkdir(output, { recursive: true });
                await fs.writeFile(
                  `${filename}.tmp`,
                  await fs.readFile(
                    path.resolve(path.dirname(configPath()), html),
                  ),
                );
                await fs.rename(`${filename}.tmp`, filename);
                return { ...tool, view: { ...tool.view, html: undefined } };
              }),
            ),
          };
          const manifest = createUiManifest(manifestDefinition, {
            assetBase:
              typeof prefix === 'string' && /^https?:\/\//.test(prefix)
                ? `${prefix.replace(/\/+$/, '')}/`
                : 'request',
          });
          const target = path.join(output, '../ui-manifest.json');
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(
            `${target}.tmp`,
            JSON.stringify(manifest, null, 2),
          );
          await fs.rename(`${target}.tmp`, target);
        },
      );
    }
  });
}
