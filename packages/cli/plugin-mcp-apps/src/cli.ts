import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createRsbuild } from '@rsbuild/core';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import {
  validateViewsConfig,
  type McpViewsConfig,
} from '@modern-js/mcp-apps/manifest';
import { startInspectorSandbox } from '@modern-js/mcp-apps-inspector/server';
import { createUiManifest, viewEntryName, type MfManifest } from './build';

// The development server can retain middleware across CLI plugin reloads.
// Share only the currently active sandbox for each application in this process.
const sandboxRegistryKey = Symbol.for('@modern-js/plugin-mcp-apps/sandboxes');
const sandboxes: Map<
  string,
  Awaited<ReturnType<typeof startInspectorSandbox>>
> = Reflect.get(globalThis, sandboxRegistryKey) ?? new Map();
Reflect.set(globalThis, sandboxRegistryKey, sandboxes);

export interface McpAppsPluginOptions {
  /** JSON UI configuration, relative to the application root. */
  views?: string;
  /** Development Inspector options. Disabled with false. */
  inspector?: false | { endpoint?: string };
}
async function writeArtifact(filename: string, contents: string | Uint8Array) {
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(`${filename}.tmp`, contents);
  await fs.rename(`${filename}.tmp`, filename);
}
export const mcpAppsPlugin = (
  options: McpAppsPluginOptions = {},
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-mcp-apps',
  post: ['@modern-js/runtime'],
  setup(api) {
    let definition: McpViewsConfig;
    const cardHtml = new Map<string, string>();
    const cardAssets = new Map<string, Buffer>();
    let buildCards: (() => Promise<void>) | undefined;
    const entries = new Map<string, string>();
    let sandbox: Awaited<ReturnType<typeof startInspectorSandbox>> | undefined;
    const configPath = () =>
      path.resolve(
        api.getAppContext().appDirectory,
        options.views ?? 'mcp-views.json',
      );
    api.addWatchFiles(() => [configPath()]);
    api.onBeforePrintInstructions(({ instructions }) => ({
      instructions: instructions
        .split('\n')
        .filter(
          line =>
            ![...entries.keys()].some(
              name => name !== 'mcp/inspector' && line.includes(name),
            ),
        )
        .join('\n'),
    }));
    const closeSandbox = async () => {
      const current = sandbox;
      sandbox = undefined;
      const appDirectory = api.getAppContext().appDirectory;
      if (sandboxes.get(appDirectory) === current)
        sandboxes.delete(appDirectory);
      await current?.close();
    };
    api.onBeforeExit(closeSandbox);
    api.onBeforeRestart(closeSandbox);
    api.config(() => ({
      dev: {
        setupMiddlewares: [
          middlewares => {
            middlewares.unshift((request, response, next) => {
              if (
                request.url?.split('?')[0] !== '/__modern_mcp_apps__/sandbox'
              ) {
                next();
                return;
              }
              response.setHeader('Cache-Control', 'no-store');
              response.setHeader('Content-Type', 'application/json');
              const activeSandbox = sandboxes.get(
                api.getAppContext().appDirectory,
              );
              if (!activeSandbox || options.inspector === false) {
                next();
                return;
              }
              if (request.method !== 'GET') {
                response.statusCode = 405;
                response.setHeader('Allow', 'GET');
                response.end();
                return;
              }
              response.end(JSON.stringify({ url: activeSandbox.url }));
            });
          },
        ],
      },
    }));
    api.modifyEntrypoints(async ({ entrypoints }) => {
      entries.clear();
      const ctx = api.getAppContext();
      const source: unknown = JSON.parse(
        await fs.readFile(configPath(), 'utf8'),
      );
      validateViewsConfig(source);
      definition = source;
      const appRequire = createRequire(
        path.join(ctx.appDirectory, 'package.json'),
      );
      const addEntry = async (name: string, code: string, label: string) => {
        if (entrypoints.some(entry => entry.entryName === name))
          throw new Error(
            `MCP entry conflicts with application entry: ${name}`,
          );
        const entry = path.join(
          ctx.internalDirectory,
          'mcp-apps/entries',
          `${name.replaceAll('/', '-')}.jsx`,
        );
        await writeArtifact(entry, code);
        entries.set(name, label);
        entrypoints.push({
          entryName: name,
          entry,
          isMainEntry: false,
          isAutoMount: true,
          absoluteEntryDir: path.dirname(entry),
        });
      };
      let needsMf = false;
      for (const [name, source] of Object.entries(definition.views)) {
        if (typeof source !== 'string') {
          needsMf = true;
          continue;
        }
        const component = path.resolve(path.dirname(configPath()), source);
        await fs.access(component);
        await addEntry(
          viewEntryName(name),
          `import { createMcpView } from ${JSON.stringify(appRequire.resolve('@modern-js/mcp-apps/react'))};\nimport View from ${JSON.stringify(component)};\nexport default createMcpView(View, ${JSON.stringify({ name, version: '1.0.0' })});\n`,
          name,
        );
      }
      cardHtml.clear();
      cardAssets.clear();
      buildCards = undefined;
      const standaloneEntries: Record<string, string> = {};
      for (const [name, source] of Object.entries(definition.views)) {
        if (typeof source !== 'string') continue;
        const entryName = viewEntryName(name);
        const entry = path.join(
          ctx.internalDirectory,
          'mcp-apps/entries',
          `${entryName}-standalone.js`,
        );
        await writeArtifact(
          entry,
          `import React from ${JSON.stringify(appRequire.resolve('react'))};
import { createRoot } from ${JSON.stringify(appRequire.resolve('react-dom/client'))};
import { createMcpView } from ${JSON.stringify(appRequire.resolve('@modern-js/mcp-apps/react'))};
import View from ${JSON.stringify(path.resolve(path.dirname(configPath()), source))};
createRoot(document.getElementById('root')).render(React.createElement(createMcpView(View, ${JSON.stringify({ name, version: '1.0.0' })})));
`,
        );
        standaloneEntries[entryName] = entry;
      }
      if (needsMf) {
        standaloneEntries['mcp-shell'] = appRequire.resolve(
          '@modern-js/mcp-apps/internal/mf-entry',
        );
      }
      if (Object.keys(standaloneEntries).length) {
        const cardsOutput = path.join(ctx.internalDirectory, 'mcp-apps/cards');
        const config = api.getNormalizedConfig();
        const development = ['dev', 'start'].includes(ctx.command);
        const assetPrefix = development
          ? config.dev.assetPrefix
          : config.output.assetPrefix;
        const cards = await createRsbuild({
          cwd: ctx.appDirectory,
          rsbuildConfig: {
            mode: 'production',
            html: { inject: 'body', title: 'MCP App' },
            source: {
              entry: standaloneEntries,
              define: {
                ...config.source.define,
                'process.env.NODE_ENV': JSON.stringify(
                  development ? 'development' : 'production',
                ),
              },
            },
            resolve: {
              alias: {
                ...config.source.alias,
                ...Object.fromEntries(
                  [
                    'react',
                    'react-dom',
                    'react-dom/client',
                    'react/jsx-runtime',
                    'react/jsx-dev-runtime',
                    ...(needsMf ? ['@module-federation/enhanced/runtime'] : []),
                  ].map(name => [name + '$', appRequire.resolve(name)]),
                ),
              },
            },
            output: {
              distPath: { root: cardsOutput },
              assetPrefix:
                typeof assetPrefix === 'string' ? assetPrefix : undefined,
              inlineScripts: true,
              inlineStyles: true,
              legalComments: 'inline',
            },
            tools: {
              swc: { jsc: { transform: { react: { runtime: 'automatic' } } } },
              rspack: {
                optimization: { splitChunks: false, nodeEnv: false },
                module: {
                  parser: { javascript: { dynamicImportMode: 'eager' } },
                },
              },
            },
          },
        });
        buildCards = async () => {
          await cards.build();
          cardAssets.clear();
          for (const filename of await fs.readdir(cardsOutput, {
            recursive: true,
          })) {
            const absolute = path.join(cardsOutput, filename);
            if (
              filename.endsWith('.html') ||
              !(await fs.stat(absolute)).isFile()
            )
              continue;
            cardAssets.set(
              filename.replaceAll(path.sep, '/'),
              await fs.readFile(absolute),
            );
          }
          for (const name of Object.keys(standaloneEntries)) {
            cardHtml.set(
              name,
              await fs.readFile(path.join(cardsOutput, `${name}.html`), 'utf8'),
            );
          }
        };
      }
      if (
        options.inspector !== false &&
        ['dev', 'start'].includes(ctx.command)
      ) {
        sandbox ??= await startInspectorSandbox();
        sandboxes.set(ctx.appDirectory, sandbox);
        const require = createRequire(import.meta.url);
        const props = {
          endpoint: options.inspector?.endpoint ?? '/api/mcp',
          sandboxEndpoint: '/__modern_mcp_apps__/sandbox',
          views: [...entries].map(([entry, name]) => ({
            name,
            url: `/${entry}`,
          })),
        };
        await addEntry(
          'mcp/inspector',
          `import { McpInspector } from ${JSON.stringify(require.resolve('@modern-js/mcp-apps-inspector'))};\nexport default function Inspector() { return <McpInspector {...${JSON.stringify(props)}} />; }\n`,
          'Inspector',
        );
      }
      return { entrypoints };
    });
    // Card bootstraps cannot depend on HMR notifications to finish compilation
    // inside a host's sandbox. Keep normal application imports lazy.
    api.modifyRsbuildConfig(config => {
      const lazy = config.dev?.lazyCompilation;
      if (!lazy) return config;
      const current = typeof lazy === 'object' ? lazy : {};
      const test = current.test;
      const internal = api.getAppContext().internalDirectory;
      const eager = [...entries.keys()].map(
        name => path.join(internal, name) + path.sep,
      );
      config.dev = {
        ...config.dev,
        lazyCompilation: {
          ...current,
          test(module) {
            const resource = (module as { resource?: string }).resource;
            if (
              resource &&
              eager.some(directory => resource.startsWith(directory))
            )
              return false;
            return typeof test === 'function'
              ? test(module)
              : test instanceof RegExp
                ? test.test(resource ?? '')
                : true;
          },
        },
      };
      return config;
    });
    api.onAfterCreateCompiler(({ compiler, environments }) => {
      api.onBeforeRestart(
        () =>
          new Promise<void>((resolve, reject) =>
            compiler.close(error => (error ? reject(error) : resolve())),
          ),
      );
      const compilers =
        'compilers' in compiler ? compiler.compilers : [compiler];
      for (const child of compilers) {
        const environment = environments[child.name ?? 'client'];
        if (!environment || environment.config.output.target !== 'web')
          continue;
        child.hooks.beforeCompile.tapPromise(
          'modern-mcp-card-build',
          async () => {
            await buildCards?.();
          },
        );
        child.hooks.thisCompilation.tap('modern-mcp-card-html', compilation => {
          compilation.hooks.processAssets.tap(
            {
              name: 'modern-mcp-card-html',
              stage: child.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
            },
            () => {
              for (const [filename, contents] of cardAssets) {
                if (!compilation.getAsset(filename))
                  compilation.emitAsset(
                    filename,
                    new child.webpack.sources.RawSource(contents),
                  );
              }
              for (const [name, html] of cardHtml) {
                const htmlPath = environment.htmlPaths[name];
                if (htmlPath && compilation.getAsset(htmlPath))
                  compilation.updateAsset(
                    htmlPath,
                    new child.webpack.sources.RawSource(html),
                  );
              }
            },
          );
        });
        child.hooks.afterEmit.tapPromise(
          'modern-mcp-ui-manifest',
          async compilation => {
            if (compilation.errors.length) return;
            const ctx = api.getAppContext();
            const development = ['dev', 'start'].includes(ctx.command);
            const output = path.join(
              development ? ctx.internalDirectory : ctx.distDirectory,
              'mcp-apps',
            );
            let mf: { filename: string; manifest: MfManifest } | undefined;
            if (
              Object.values(definition.views).some(
                view => typeof view !== 'string',
              )
            ) {
              for (const asset of compilation.getAssets()) {
                if (
                  !asset.name.endsWith('.json') ||
                  asset.name.endsWith('mf-stats.json')
                )
                  continue;
                try {
                  const value = JSON.parse(String(asset.source.source()));
                  if (
                    typeof value.name === 'string' &&
                    value.metaData?.remoteEntry &&
                    Array.isArray(value.exposes)
                  ) {
                    if (mf)
                      throw new Error(
                        'Multiple MF manifests found in a single web compilation',
                      );
                    mf = { filename: asset.name, manifest: value };
                  }
                } catch (error) {
                  if (!(error instanceof SyntaxError)) throw error;
                }
              }
            }
            const mfShellHtml = cardHtml.get('mcp-shell');
            if (mfShellHtml)
              await writeArtifact(
                path.join(output, 'ui/mcp-shell.html'),
                mfShellHtml,
              );
            const config = api.getNormalizedConfig();
            const manifest = createUiManifest(
              definition,
              development ? config.dev.assetPrefix : config.output.assetPrefix,
              mf,
            );
            for (const [name] of entries) {
              if (name === 'mcp/inspector') continue;
              const htmlPath = environment.htmlPaths[name];
              const html = htmlPath && compilation.getAsset(htmlPath);
              if (!html) throw new Error(`Missing MCP HTML output: ${name}`);
              await writeArtifact(
                path.join(output, 'ui', `${name}.html`),
                html.source.source(),
              );
            }
            await writeArtifact(
              path.join(output, 'ui-manifest.json'),
              `${JSON.stringify(manifest, null, 2)}\n`,
            );
          },
        );
      }
    });
  },
});
export default mcpAppsPlugin;
