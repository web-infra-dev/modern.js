import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { createRsbuild } from '@rsbuild/core';
import type { RsbuildConfig } from '@rsbuild/core';
import { validateViewsConfig } from '../manifest';
import { createUiManifest, viewEntryName, type UiCsp } from './build';

export interface McpStdioOptions {
  /** Module default-exporting a server factory that accepts RegisterUiOptions. */
  server: string;
  /** Dedicated output outside the normal application dist. Defaults to dist-mcp. */
  output?: string;
}
const sdkFile = (filename: string) =>
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../dist/esm',
    filename,
  );

/** Isolated production builds, without starting HTTP or importing server code into UI. */
export async function prepareStdio(input: {
  root: string;
  views: string;
  stdio: McpStdioOptions;
  define?: NonNullable<RsbuildConfig['source']>['define'];
  alias?: Record<string, string | string[]>;
  applicationDist?: string;
  csp?: UiCsp;
  mfRuntime?: string;
}) {
  const { root, stdio } = input;
  const configFile = path.resolve(root, input.views);
  const definition: unknown = JSON.parse(await fs.readFile(configFile, 'utf8'));
  validateViewsConfig(definition);
  if (!Object.keys(definition.views).length)
    throw new Error('mcp-prepare requires at least one view');
  for (const [name, view] of Object.entries(definition.views))
    if (typeof view !== 'string' && !(view.remote ?? definition.remote))
      throw new Error(
        `STDIO MF view ${name} requires an explicit remote manifest URL. Build and host this application's MF resources first`,
      );
  const manifest = {
    ...createUiManifest(definition, undefined, undefined, input.csp),
    inline: true,
  };
  const output = path.resolve(root, stdio.output ?? 'dist-mcp');
  if (output === root || !output.startsWith(root + path.sep))
    throw new Error(
      'stdio.output must be a dedicated directory inside the application',
    );
  const appDist = path.resolve(root, input.applicationDist ?? 'dist');
  if (output === appDist || output.startsWith(appDist + path.sep))
    throw new Error(
      'stdio.output must be outside the application dist directory',
    );
  if ((await fs.lstat(output).catch(() => undefined))?.isSymbolicLink())
    throw new Error('stdio.output must not be a symbolic link');
  for (const component of Object.values(definition.views)) {
    if (typeof component !== 'string') continue;
    const source = path.resolve(path.dirname(configFile), component);
    if (source === output || source.startsWith(output + path.sep))
      throw new Error('stdio.output must not contain view source files');
  }
  const server = path.resolve(root, stdio.server);
  if (server.startsWith(output + path.sep))
    throw new Error('stdio.server must be outside stdio.output');
  const staging = await fs.mkdtemp(path.join(root, '.mcp-prepare-'));
  const appRequire = createRequire(path.join(root, 'package.json'));
  const entries: Record<string, string> = {};
  try {
    for (const [name, component] of Object.entries(definition.views)) {
      const entryName = viewEntryName(name);
      const filename = path.join(staging, `${entryName}.jsx`);
      if (typeof component !== 'string' && 'expose' in component) {
        entries[entryName] = sdkFile('mf-entry.mjs');
        continue;
      }
      await fs.writeFile(
        filename,
        `import React from ${JSON.stringify(appRequire.resolve('react'))};\nimport { createRoot } from ${JSON.stringify(appRequire.resolve('react-dom/client'))};\nimport { createMcpView } from ${JSON.stringify(sdkFile('react.mjs'))};\nimport View, * as viewModule from ${JSON.stringify(path.resolve(path.dirname(configFile), component as string))};\ncreateRoot(document.getElementById('root')).render(React.createElement(createMcpView(View, ${JSON.stringify({ name, version: '1.0.0' })}, Reflect.get(viewModule, 'mcpCapabilities'))));\n`,
      );
      entries[entryName] = filename;
    }
    const browser = await createRsbuild({
      cwd: root,
      rsbuildConfig: {
        mode: 'production',
        source: { entry: entries, define: input.define },
        resolve: {
          alias: {
            ...input.alias,
            ...(Object.keys(manifest.remotes).length
              ? {
                  '@module-federation/enhanced/runtime$': appRequire.resolve(
                    input.mfRuntime ?? '@module-federation/enhanced/runtime',
                  ),
                }
              : {}),
            ...Object.fromEntries(
              [
                'react',
                'react-dom',
                'react-dom/client',
                'react/jsx-runtime',
                'react/jsx-dev-runtime',
              ].map(name => [name + '$', appRequire.resolve(name)]),
            ),
          },
        },
        html: { title: 'MCP App', inject: 'body' },
        output: {
          distPath: { root: path.join(staging, 'web') },
          assetPrefix: '/',
          inlineScripts: true,
          inlineStyles: true,
          dataUriLimit: Number.MAX_SAFE_INTEGER,
          sourceMap: false,
          legalComments: 'inline',
        },
        performance: { chunkSplit: { strategy: 'all-in-one' } },
        tools: {
          // This isolated build does not load the application's React plugin.
          // jsx:preserve in app tsconfig must not fall back to React globals.
          swc: { jsc: { transform: { react: { runtime: 'automatic' } } } },
          rspack: {
            optimization: { splitChunks: false },
            module: { parser: { javascript: { dynamicImportMode: 'eager' } } },
          },
        },
      },
    });
    const uiBuild = await browser.build();
    await uiBuild.close();
    const artifact = path.join(staging, 'artifact');
    await fs.mkdir(path.join(artifact, 'ui'), { recursive: true });
    for (const name of Object.keys(definition.views)) {
      let html = await fs.readFile(
        path.join(staging, 'web', `${viewEntryName(name)}.html`),
        'utf8',
      );
      const view = manifest.views[name];
      if ('remote' in view) {
        const remote = manifest.remotes[view.remote];
        const origin = new URL(remote.entry).origin;
        const config = JSON.stringify({
          name: view.remote,
          entry: remote.entry,
          expose: view.expose,
          view: name,
        }).replace(/</g, '\\u003c');
        html = html.replace(
          /<head\b[^>]*>/i,
          head =>
            `${head}<script type="application/json" id="modern-mcp-config">${config}</script>`,
        );
        manifest.views[name] = {
          html: `./ui/${viewEntryName(name)}.html`,
          ui: {
            ...view.ui,
            csp: {
              ...view.ui.csp,
              resourceDomains: [
                ...new Set([...(view.ui.csp?.resourceDomains ?? []), origin]),
              ],
              connectDomains: [
                ...new Set([...(view.ui.csp?.connectDomains ?? []), origin]),
              ],
            },
          },
        };
      }
      if (
        /<script\b[^>]*\bsrc\s*=|<link\b[^>]*\brel\s*=\s*["']?(?:stylesheet|preload|modulepreload)|<base\b/i.test(
          html,
        )
      )
        throw new Error(`View ${name} still requires external assets`);
      if (Buffer.byteLength(html) > 5 * 1024 * 1024)
        throw new Error(`View ${name} exceeds the 5 MiB inline HTML limit`);
      for (const script of html.matchAll(
        /<script\b(?![^>]*type=["']application\/json["'])[^>]*>([\s\S]*?)<\/script\s*>/gi,
      ))
        new Script(script[1]);
      await fs.writeFile(
        path.join(artifact, 'ui', `${viewEntryName(name)}.html`),
        html,
      );
    }
    manifest.remotes = {};
    await fs.writeFile(
      path.join(artifact, 'ui-manifest.json'),
      JSON.stringify(manifest, null, 2),
    );
    const runner = path.join(staging, 'server.js');
    await fs.writeFile(
      runner,
      `import createServer from ${JSON.stringify(server)};\nimport { StdioServerTransport } from '@modelcontextprotocol/server/stdio';\nimport path from 'node:path';\nasync function main() { const server = await createServer({ manifest: path.join(__dirname, 'ui-manifest.json'), mode: 'production' }); await server.connect(new StdioServerTransport()); }\nmain().catch(error => { console.error(error); process.exitCode = 1; });\n`,
    );
    const node = await createRsbuild({
      cwd: root,
      rsbuildConfig: {
        mode: 'production',
        source: { entry: { server: runner }, define: input.define },
        resolve: { alias: input.alias },
        output: {
          target: 'node',
          distPath: { root: artifact },
          cleanDistPath: false,
          filename: { js: '[name].cjs' },
          sourceMap: false,
          minify: false,
        },
        tools: {
          rspack: {
            node: { __dirname: false },
            externals: [
              ({ request }, callback) => {
                if (
                  request &&
                  !request.startsWith('.') &&
                  !path.isAbsolute(request) &&
                  !Object.keys(input.alias ?? {}).some(
                    key =>
                      request === key.replace(/\$$/, '') ||
                      (!key.endsWith('$') && request.startsWith(key + '/')),
                  )
                ) {
                  try {
                    // Keep installed packages external but let tsconfig paths
                    // and other source aliases go through the build resolver.
                    appRequire.resolve(request);
                    return callback(null, `commonjs ${request}`);
                  } catch {
                    // An unresolved source alias must not become a runtime require.
                  }
                }
                callback();
              },
            ],
          },
        },
      },
    });
    const nodeBuild = await node.build();
    await nodeBuild.close();
    // Publish only after both builds and HTML validation succeeded. Never clean normal dist.
    await fs.mkdir(output, { recursive: true });
    await fs.cp(artifact, output, { recursive: true });
    return {
      command: process.execPath,
      args: [path.join(output, 'server.cjs')],
    };
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}
