import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import type { McpAppsDefinition } from '@modern-js/mcp-apps/config';
import { getUiEntryName } from '@modern-js/mcp-apps/server';
import { createLoadedConfig } from '@modern-js/plugin/cli';

export interface BuiltView {
  html: string;
  assetBase: string;
}

/** Add standard auto-mounted Modern.js entries, then retain their emitted HTML. */
export function setupMcpUi(
  api: Parameters<NonNullable<CliPlugin<AppTools>['setup']>>[0],
  configPath: () => string,
) {
  const entries = new Map<string, string>();
  const views: Record<string, BuiltView> = Object.create(null);
  api.modifyEntrypoints(async ({ entrypoints }) => {
    entries.clear();
    for (const key of Object.keys(views)) delete views[key];
    const ctx = api.getAppContext();
    const config = api.getNormalizedConfig();
    const { config: definition } = await createLoadedConfig<McpAppsDefinition>(
      ctx.appDirectory,
      configPath(),
    );
    for (const tool of definition.tools) {
      if (!tool.view || tool.remote || tool.view.html) continue;
      if (tool.view.renderMode && tool.view.renderMode !== 'component') {
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
      const source = `import { createMcpView } from '@modern-js/mcp-apps/react';
import { ${tool.view.exportName ?? 'default'} as View } from ${JSON.stringify(component)};
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
      const prefix = ['dev', 'start'].includes(ctx.command)
        ? config.dev.assetPrefix
        : config.output.assetPrefix;
      views[tool.name] = {
        html: `./ui/${entryName}.html`,
        assetBase:
          typeof prefix === 'string' && /^https?:\/\//.test(prefix)
            ? `${prefix.replace(/\/+$/, '')}/`
            : 'request',
      };
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
          for (const [entryName] of entries) {
            const htmlPath = environment.htmlPaths[entryName];
            if (!htmlPath) continue;
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
        },
      );
    }
  });
  return views;
}
