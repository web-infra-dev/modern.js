import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { loadMcpAppsConfig, resolveLocalHandlerModule } from './loader';
import { readRuntimeHtml } from './resources';
import { createMcpHandler } from './server';

export interface CompileMcpAppsOptions {
  configPath: string;
  outDir: string;
  tsconfig?: string;
  alias?: Record<string, string>;
  development?: boolean;
}

/** Compile a relocatable definition and local handlers without evaluating handlers. */
export async function compileMcpApps(options: CompileMcpAppsOptions) {
  const configPath = path.resolve(options.configPath);
  const outDir = path.resolve(options.outDir);
  const revision = `build-${randomUUID()}`;
  const generation = path.join(outDir, revision);
  await fs.mkdir(generation, { recursive: true });
  const dependencies = new Set([configPath]);
  const emit = async (entry: string, name: string) => {
    const result = await build({
      entryPoints: [entry],
      outfile: path.join(generation, name),
      absWorkingDir: path.dirname(configPath),
      bundle: true,
      packages: 'external',
      platform: 'node',
      format: 'esm',
      target: 'node20',
      metafile: true,
      logLevel: 'silent',
      tsconfig: options.tsconfig,
      alias: options.alias,
      // Dependencies remain external, while CommonJS imports in user source work.
      banner: {
        js: "import { createRequire as __mcpCreateRequire } from 'node:module'; const require = __mcpCreateRequire(import.meta.url);",
      },
    });
    for (const file of Object.keys(result.metafile.inputs)) {
      dependencies.add(path.resolve(path.dirname(configPath), file));
    }
  };
  try {
    await emit(configPath, 'definition.mjs');
    const definition = await loadMcpAppsConfig(
      path.join(generation, 'definition.mjs'),
    );
    createMcpHandler(definition); // validate schemas and resource bindings without calling tools
    const mapping: Record<string, string> = {};
    for (const tool of definition.tools) {
      if (!tool.handler || (tool.handler.runtime ?? 'local') !== 'local')
        continue;
      const module = tool.handler.module;
      if (Object.hasOwn(mapping, module)) continue;
      const source = await resolveLocalHandlerModule(module, configPath);
      const name = `handler-${Object.keys(mapping).length}.mjs`;
      await emit(source, name);
      mapping[module] = `./${revision}/${name}`;
    }
    const views: Record<string, string> = {};
    for (const tool of definition.tools) {
      if (!tool.view || tool.remote) continue;
      const source = await resolveLocalHandlerModule(
        tool.view.module,
        configPath,
      );
      const filename = `view-${Object.keys(views).length}`;
      const result = await build({
        stdin: {
          contents: `import React from 'react';
import { createRoot } from 'react-dom/client';
import { useMcpApp } from '@modern-js/mcp-apps/react';
import * as ViewModule from ${JSON.stringify(source)};
const View = ViewModule[${JSON.stringify(tool.view.exportName ?? 'default')}];
function Card() {
  const { app, isConnected, error, input, result, cancelled } = useMcpApp({ appInfo: { name: ${JSON.stringify(tool.name)}, version: '1.0.0' }, capabilities: {} });
  const output = result?.structuredContent;
  if (error) return React.createElement('p', { role: 'alert' }, error.message);
  if (cancelled) return React.createElement('p', null, 'Tool cancelled');
  if (!app || !isConnected) return React.createElement('p', null, 'Connecting…');
  return React.createElement(View, { ...(input ?? {}), ...(output?.args ?? {}), ...(output?.viewProps ?? {}), mcpApp: app });
}
createRoot(document.getElementById('root')).render(React.createElement(Card));`,
          resolveDir: path.dirname(configPath),
          loader: 'tsx',
          sourcefile: 'mcp-view.tsx',
        },
        outfile: path.join(generation, `${filename}.js`),
        bundle: true,
        platform: 'browser',
        format: 'iife',
        target: 'es2022',
        jsx: 'automatic',
        minify: !options.development,
        write: false,
        metafile: true,
        define: {
          'process.env.NODE_ENV': JSON.stringify(
            options.development ? 'development' : 'production',
          ),
        },
        loader: {
          '.png': 'dataurl',
          '.jpg': 'dataurl',
          '.svg': 'dataurl',
          '.woff2': 'dataurl',
        },
        tsconfig: options.tsconfig,
        alias: options.alias,
        absWorkingDir: path.dirname(configPath),
        logLevel: 'silent',
      });
      if ((tool.view.renderMode ?? 'component') !== 'component')
        throw new Error('Local views support component renderMode only');
      const js = result.outputFiles
        .find(file => file.path.endsWith('.js'))!
        .text.replace(/<\/script/gi, '<\\/script');
      const css = (
        result.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? ''
      ).replace(/<\/style/gi, '<\\/style');
      await fs.writeFile(
        path.join(generation, `${filename}.html`),
        `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`,
      );
      views[tool.name] = `./${revision}/${filename}.html`;
      for (const file of Object.keys(result.metafile.inputs)) {
        if (file !== 'mcp-view.tsx')
          dependencies.add(path.resolve(path.dirname(configPath), file));
      }
    }
    // Keep configuration evaluation at runtime (notably remote URLs from env).
    // Only local handler module references are rewritten to compiled artifacts.
    const wrapper = `import * as configModule from './${revision}/definition.mjs';
const definition = configModule.default ?? configModule.config ?? configModule.mcpApps;
const mapping = ${JSON.stringify(mapping)};
const views = ${JSON.stringify(views)};
export default { ...definition, tools: definition.tools.map(tool => {
  if (tool.view && !tool.remote) {
    if (!views[tool.name]) throw new Error('MCP local view set changed since build; rebuild the app');
    tool = { ...tool, view: { ...tool.view, html: tool.view.html ?? views[tool.name] } };
  }
  if (!tool.handler || (tool.handler.runtime ?? 'local') !== 'local') return tool;
  const module = mapping[tool.handler.module];
  if (!module) throw new Error('MCP local handler set changed since build; rebuild the app');
  return { ...tool, handler: { ...tool.handler, module } };
}) };
`;
    if (definition.remotes.length) {
      await fs.writeFile(
        path.join(outDir, 'runtime.html'),
        await readRuntimeHtml(options.development),
      );
    }
    const temporary = path.join(outDir, `${revision}.tmp`);
    await fs.writeFile(temporary, wrapper);
    // Publish only after every artifact is ready. Failed builds keep the old entry.
    const entry = path.join(outDir, 'mcp_apps.mjs');
    await fs.rename(temporary, entry);
    return { entry, dependencies: [...dependencies] };
  } catch (error) {
    await fs.rm(generation, { recursive: true, force: true });
    throw error;
  }
}
