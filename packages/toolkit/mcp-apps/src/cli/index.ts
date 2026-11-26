import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createRsbuild } from '@rsbuild/core';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { validateViewsConfig, type McpViewsConfig } from '../manifest';
import {
  createUiManifest,
  findMfManifest,
  validateInlineHtml,
  viewEntryName,
  type MfManifest,
  type UiCsp,
} from './build';

import {
  buildPluginPackage,
  type McpHttpServerConfig,
  type PluginPackageOptions,
} from './plugin-package';
export type {
  McpHttpServerConfig,
  PluginPackageOptions,
} from './plugin-package';

export type { StdioBridgeOptions } from './stdio';

export interface McpAppsPluginOptions {
  /** Generate dist/plugin/mcp.json and package user-owned plugin declarations. */
  mcpServers?: Record<string, McpHttpServerConfig>;
  /** Plugin source package settings. Requires mcpServers. */
  plugin?: PluginPackageOptions;
  /** JSON UI configuration, relative to the application root. */
  views?: string;
  /** Automatically connect existing application entries when embedded. Defaults to true. */
  entryAutoConnect?: boolean;
  /** CSP domains added to every view, merged with the csp in the views file. */
  csp?: UiCsp;
  /**
   * Bundle local component views into self-contained inline HTML without external assets.
   * - `false` (default): build local views as standard multi-entry pages
   * - `'dev'`: inline local views during `modern dev` / `modern start` only
   * - `true`: inline local views in both development and production builds
   */
  inline?: boolean | 'dev';
  mf?: {
    /** MF manifest filename in the build output. Defaults to 'mf-manifest.json'. */
    manifestFile?: string;
    /** Module providing the shell's MF `createInstance`. Defaults to '@module-federation/enhanced/runtime'. */
    runtime?: string;
  };
}

function shouldInline(
  inline: McpAppsPluginOptions['inline'],
  command: string,
): boolean {
  return (
    inline === true || (inline === 'dev' && ['dev', 'start'].includes(command))
  );
}

function resolveConfigAlias(config: {
  source?: { alias?: unknown };
  resolve?: { alias?: unknown };
}): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  for (const entry of [config.resolve?.alias, config.source?.alias]) {
    const items = Array.isArray(entry) ? entry : [entry];
    for (const item of items) {
      if (typeof item === 'function') {
        const next = item(result);
        if (next && typeof next === 'object') Object.assign(result, next);
      } else if (item && typeof item === 'object') {
        Object.assign(result, item);
      }
    }
  }
  return result;
}

function resolveMcpDevUrl(
  port: number | undefined,
  config: {
    dev?: { https?: unknown };
    bff?: { prefix?: string | string[] };
  },
): string {
  const protocol = config.dev?.https ? 'https' : 'http';
  const rawPrefix = config.bff?.prefix;
  const prefix =
    typeof rawPrefix === 'string'
      ? rawPrefix
      : Array.isArray(rawPrefix) && typeof rawPrefix[0] === 'string'
        ? rawPrefix[0]
        : '/api';
  const normalized = `/${prefix.replace(/^\/+|\/+$/g, '')}`;
  return `${protocol}://localhost:${port ?? 8080}${normalized === '/' ? '' : normalized}/mcp`;
}

async function writeArtifact(filename: string, contents: string | Uint8Array) {
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(`${filename}.tmp`, contents);
  await fs.rename(`${filename}.tmp`, filename);
}

// Both src/cli and dist/<format> sit two levels below the package root.
// Wrapping frameworks may not install this package directly, so SDK files
// resolve from here. React and the MF runtime still resolve from the app.
const packageRoot = () =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packageFile = (filename: string) =>
  path.resolve(packageRoot(), 'dist/esm', filename);
const stdioBinFile = () =>
  path.resolve(packageRoot(), 'bin/modern-mcp-stdio.js');

export const mcpAppsPlugin = (
  options: McpAppsPluginOptions = {},
): CliPlugin<AppTools> => ({
  name: '@modern-js/mcp-apps',
  post: ['@modern-js/runtime'],
  setup(api) {
    if (options.plugin && !options.mcpServers)
      throw new Error('Plugin packaging requires mcpServers');
    api.onAfterBuild(async () => {
      if (!options.mcpServers) return;
      const ctx = api.getAppContext();
      await buildPluginPackage(
        ctx.appDirectory,
        ctx.distDirectory,
        options.mcpServers,
        options.plugin,
      );
    });

    api._internalServerPlugins(({ plugins }) => {
      const ctx = api.getAppContext();
      plugins.push({
        name: '@modern-js/mcp-apps/server-plugin',
        options: ['dev', 'start'].includes(ctx.command)
          ? {
              developmentManifest: path.join(
                ctx.internalDirectory,
                'mcp-apps/ui-manifest.json',
              ),
            }
          : {},
      });
      return { plugins };
    });

    let definition: McpViewsConfig;
    const attachedCompilers = new WeakSet<object>();
    const shellHtml = new Map<string, string>();
    const shellAssets = new Map<string, Buffer>();
    const inlineHtml = new Map<string, string>();
    let buildShell: (() => Promise<void>) | undefined;
    let shellDirty = true;
    let shellBuild: Promise<void> | undefined;
    let buildInline: (() => Promise<void>) | undefined;
    let inlineDirty = true;
    let inlineBuild: Promise<void> | undefined;
    let closeInlineWatch: (() => Promise<void>) | undefined;
    const localEntries = new Set<string>();
    const configPath = () =>
      path.resolve(
        api.getAppContext().appDirectory,
        options.views ?? 'mcp-views.json',
      );

    api.addWatchFiles(() => [configPath()]);

    api.modifyEntrypoints(async ({ entrypoints: current }) => {
      const ctx = api.getAppContext();
      const source: unknown = JSON.parse(
        await fs.readFile(configPath(), 'utf8'),
      );
      validateViewsConfig(source);
      definition = source;
      const appRequire = createRequire(
        path.join(ctx.appDirectory, 'package.json'),
      );
      const needsMf = Object.values(definition.views).some(
        view => typeof view !== 'string' && 'expose' in view,
      );
      const useInline = shouldInline(options.inline, ctx.command);
      if (closeInlineWatch) {
        const stop = closeInlineWatch;
        closeInlineWatch = undefined;
        await stop();
      }
      localEntries.clear();
      shellHtml.clear();
      shellAssets.clear();
      inlineHtml.clear();
      buildShell = undefined;
      shellDirty = true;
      shellBuild = undefined;
      buildInline = undefined;
      inlineDirty = true;
      inlineBuild = undefined;

      const shellEntries: Record<string, string> = {};
      const inlineEntries: Record<string, string> = {};
      const inlineViewNames = new Map<string, string>();
      const entryDir = path.join(ctx.internalDirectory, 'mcp-apps/entries');
      // Drop entries generated by a previous run of this hook.
      const entrypoints = current.filter(
        entry => entry.absoluteEntryDir !== entryDir,
      );
      const config = api.getNormalizedConfig();
      const { enableAsyncEntry } = config.source;
      for (const [name, view] of Object.entries(definition.views)) {
        if (typeof view === 'string' || !('entry' in view)) continue;
        if (!entrypoints.some(entry => entry.entryName === view.entry))
          throw new Error(
            `View ${name} references missing application entry: ${view.entry}`,
          );
      }
      for (const [name, viewSource] of Object.entries(definition.views)) {
        if (typeof viewSource !== 'string' && !('component' in viewSource))
          continue;
        const component =
          typeof viewSource === 'string' ? viewSource : viewSource.component;
        const entryName = viewEntryName(name);
        if (
          !useInline &&
          entrypoints.some(entry => entry.entryName === entryName)
        )
          throw new Error(
            `MCP entry conflicts with application entry: ${entryName}`,
          );
        const entry = path.join(entryDir, `${entryName}.jsx`);
        const mountEntry =
          !useInline && enableAsyncEntry
            ? path.join(entryDir, `${entryName}-mount.jsx`)
            : entry;
        await writeArtifact(
          mountEntry,
          `import React from ${JSON.stringify(appRequire.resolve('react'))};\nimport { createRoot } from ${JSON.stringify(appRequire.resolve('react-dom/client'))};\nimport { createMcpView } from ${JSON.stringify(packageFile('react.mjs'))};\nimport View, * as viewModule from ${JSON.stringify(path.resolve(path.dirname(configPath()), component))};\ncreateRoot(document.getElementById('root')).render(React.createElement(createMcpView(View, ${JSON.stringify({ name, version: '1.0.0' })}, Reflect.get(viewModule, 'mcpCapabilities'))));\n`,
        );
        if (useInline) {
          inlineEntries[entryName] = mountEntry;
          inlineViewNames.set(entryName, name);
          continue;
        }
        // MF shared dependencies initialize asynchronously. Mount directly
        // instead of loading the framework's page runtime, which reads cookies
        // unavailable in an opaque app sandbox.
        if (enableAsyncEntry)
          await writeArtifact(
            entry,
            `import(${JSON.stringify(mountEntry)});\n`,
          );
        localEntries.add(entryName);
        entrypoints.push({
          entryName,
          entry,
          isMainEntry: false,
          isAutoMount: false,
          absoluteEntryDir: entryDir,
        });
      }

      const development = ['dev', 'start'].includes(ctx.command);
      const resolvedAlias = resolveConfigAlias(config);
      const reactAliases = Object.fromEntries(
        [
          'react',
          'react-dom',
          'react-dom/client',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
        ].map(name => [name + '$', appRequire.resolve(name)]),
      );

      if (Object.keys(inlineEntries).length) {
        const inlineOutput = path.join(
          ctx.internalDirectory,
          'mcp-apps/inline',
        );
        const uiOutputDir = path.join(ctx.internalDirectory, 'mcp-apps/ui');
        const inlineBuilder = await createRsbuild({
          cwd: ctx.appDirectory,
          rsbuildConfig: {
            mode: 'production',
            ...(config.builderPlugins?.length
              ? { plugins: config.builderPlugins }
              : {}),
            html: { inject: 'body', title: 'MCP App' },
            source: {
              entry: inlineEntries,
              define: {
                ...config.source.define,
                'process.env.NODE_ENV': JSON.stringify(
                  development ? 'development' : 'production',
                ),
              },
            },
            resolve: {
              alias: {
                ...resolvedAlias,
                ...reactAliases,
              },
            },
            output: {
              distPath: { root: inlineOutput },
              cleanDistPath: false,
              assetPrefix: '/',
              inlineScripts: true,
              inlineStyles: true,
              dataUriLimit: Number.MAX_SAFE_INTEGER,
              sourceMap: false,
              legalComments: 'inline',
            },
            performance: { chunkSplit: { strategy: 'all-in-one' } },
            tools: {
              ...(config.tools?.postcss
                ? { postcss: config.tools.postcss }
                : {}),
              swc: {
                jsc: { transform: { react: { runtime: 'automatic' } } },
              },
              rspack: {
                optimization: { splitChunks: false, nodeEnv: false },
                module: {
                  parser: { javascript: { dynamicImportMode: 'eager' } },
                },
              },
            },
          },
        });

        const collectInlineHtml = async (writeDir?: string) => {
          const next = new Map<string, string>();
          for (const [entryName, viewName] of inlineViewNames) {
            const html = await fs.readFile(
              path.join(inlineOutput, `${entryName}.html`),
              'utf8',
            );
            validateInlineHtml(viewName, html);
            next.set(entryName, html);
          }
          inlineHtml.clear();
          for (const [entryName, html] of next) {
            inlineHtml.set(entryName, html);
            if (writeDir)
              await writeArtifact(
                path.join(writeDir, `${entryName}.html`),
                html,
              );
          }
        };

        let pendingInitial:
          { resolve: () => void; reject: (err: Error) => void } | undefined;

        if (development) {
          inlineBuilder.onAfterBuild(async ({ isFirstCompile, stats }) => {
            const initial = isFirstCompile ? pendingInitial : undefined;
            if (isFirstCompile) pendingInitial = undefined;
            if (stats?.hasErrors()) {
              initial?.reject(new Error('Failed to build inline MCP UI views'));
              return;
            }
            try {
              await collectInlineHtml(isFirstCompile ? undefined : uiOutputDir);
              initial?.resolve();
            } catch (error) {
              const err =
                error instanceof Error ? error : new Error(String(error));
              if (initial) initial.reject(err);
              else
                console.error(
                  `[@modern-js/mcp-apps] Failed to update inline view: ${err.message}`,
                );
            }
          });
        }

        const runInlineBuild = async () => {
          if (development) {
            const ready = new Promise<void>((resolve, reject) => {
              pendingInitial = { resolve, reject };
            });
            const result = await inlineBuilder.build({ watch: true });
            closeInlineWatch = () => result.close();
            try {
              await ready;
            } catch (error) {
              closeInlineWatch = undefined;
              await result.close();
              throw error;
            }
            return;
          }
          const result = await inlineBuilder.build();
          await result.close();
          if (result.stats?.hasErrors())
            throw new Error('Failed to build inline MCP UI views');
          await collectInlineHtml();
        };

        buildInline = () => {
          if (inlineBuild) return inlineBuild;
          if (!inlineDirty) return Promise.resolve();
          inlineDirty = false;
          inlineBuild = runInlineBuild()
            .catch(error => {
              inlineDirty = true;
              throw error;
            })
            .finally(() => {
              inlineBuild = undefined;
            });
          return inlineBuild;
        };
      }

      if (needsMf) {
        shellEntries['mcp-shell'] = packageFile('mf-entry.mjs');
      }
      if (Object.keys(shellEntries).length) {
        const shellOutput = path.join(ctx.internalDirectory, 'mcp-apps/shell');
        const assetPrefix = development
          ? config.dev.assetPrefix
          : config.output.assetPrefix;
        const shell = await createRsbuild({
          cwd: ctx.appDirectory,
          rsbuildConfig: {
            mode: 'production',
            html: { inject: 'body', title: 'MCP App' },
            source: {
              entry: shellEntries,
              define: {
                ...config.source.define,
                'process.env.NODE_ENV': JSON.stringify(
                  development ? 'development' : 'production',
                ),
              },
            },
            resolve: {
              alias: {
                ...resolvedAlias,
                ...reactAliases,
                ...(needsMf
                  ? {
                      '@module-federation/enhanced/runtime$':
                        appRequire.resolve(
                          options.mf?.runtime ??
                            '@module-federation/enhanced/runtime',
                        ),
                    }
                  : {}),
              },
            },
            output: {
              distPath: { root: shellOutput },
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
        const compileShell = async () => {
          const result = await shell.build();
          await result.close();
          shellAssets.clear();
          for (const filename of await fs.readdir(shellOutput, {
            recursive: true,
          })) {
            const absolute = path.join(shellOutput, filename);
            if (
              filename.endsWith('.html') ||
              !(await fs.stat(absolute)).isFile()
            )
              continue;
            shellAssets.set(
              filename.replaceAll(path.sep, '/'),
              await fs.readFile(absolute),
            );
          }
          for (const name of Object.keys(shellEntries)) {
            shellHtml.set(
              name,
              await fs.readFile(path.join(shellOutput, `${name}.html`), 'utf8'),
            );
          }
        };
        buildShell = () => {
          if (shellBuild) return shellBuild;
          if (!shellDirty) return Promise.resolve();
          shellDirty = false;
          shellBuild = compileShell()
            .catch(error => {
              shellDirty = true;
              throw error;
            })
            .finally(() => {
              shellBuild = undefined;
            });
          return shellBuild;
        };
      }
      // Local cards use the application multi-entry pipeline unless inline mode is enabled.
      return { entrypoints };
    });

    api.modifyRsbuildConfig(config => {
      const entries =
        config.environments?.client?.source?.entry ?? config.source?.entry;
      if (entries && definition && options.entryAutoConnect !== false) {
        const selected = new Set(
          Object.values(definition.views).flatMap(view =>
            typeof view !== 'string' && 'entry' in view ? [view.entry] : [],
          ),
        );
        for (const name of selected) {
          const entry = entries[name];
          if (!entry) continue;
          const bootstrap = packageFile('app-entry.mjs');
          if (typeof entry === 'string') entries[name] = [bootstrap, entry];
          else if (Array.isArray(entry))
            entries[name] = [
              bootstrap,
              ...entry.filter(item => item !== bootstrap),
            ];
          else
            entries[name] = {
              ...entry,
              import: [
                bootstrap,
                ...(typeof entry.import === 'string'
                  ? [entry.import]
                  : (entry.import ?? [])
                ).filter(item => item !== bootstrap),
              ],
            };
        }
      }
      const lazy = config.dev?.lazyCompilation;
      if (!lazy) return config;
      const current = typeof lazy === 'object' ? lazy : {};
      const test = current.test;
      const internal = api.getAppContext().internalDirectory;
      const eager = [path.join(internal, 'mcp-apps/entries') + path.sep];
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
      api.onBeforeRestart(async () => {
        if (closeInlineWatch) {
          const stop = closeInlineWatch;
          closeInlineWatch = undefined;
          await stop();
        }
        await new Promise<void>((resolve, reject) =>
          compiler.close(error => (error ? reject(error) : resolve())),
        );
      });
      const compilers =
        'compilers' in compiler ? compiler.compilers : [compiler];
      for (const child of compilers) {
        if (attachedCompilers.has(child)) continue;
        const environment = environments[child.name ?? 'client'];
        if (!environment || environment.config.output.target !== 'web')
          continue;
        attachedCompilers.add(child);
        child.hooks.invalid.tap('modern-mcp-card-invalidate', () => {
          shellDirty = true;
        });
        child.hooks.beforeCompile.tapPromise(
          'modern-mcp-card-build',
          async () => {
            await buildShell?.();
            await buildInline?.();
          },
        );
        child.hooks.thisCompilation.tap('modern-mcp-card-html', compilation => {
          compilation.hooks.processAssets.tap(
            {
              name: 'modern-mcp-card-html',
              stage: child.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
            },
            () => {
              for (const [filename, contents] of shellAssets) {
                if (!compilation.getAsset(filename))
                  compilation.emitAsset(
                    filename,
                    new child.webpack.sources.RawSource(contents),
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
            const useInline = shouldInline(options.inline, ctx.command);
            const output = path.join(
              development ? ctx.internalDirectory : ctx.distDirectory,
              'mcp-apps',
            );
            let mf: { filename: string; manifest: MfManifest } | undefined;
            // Only exposes of this application need its MF build output.
            if (
              Object.values(definition.views).some(
                view =>
                  typeof view !== 'string' &&
                  'expose' in view &&
                  view.remote === undefined &&
                  definition.remote === undefined,
              )
            ) {
              mf = findMfManifest(
                compilation.getAssets(),
                options.mf?.manifestFile ?? 'mf-manifest.json',
              );
            }
            const config = api.getNormalizedConfig();
            // Deployment plugins can change the bundler public path after app
            // configuration is normalized. Use the path that emitted the assets.
            const publicPath = child.options.output?.publicPath;
            const assetPrefix = development
              ? config.dev.assetPrefix
              : typeof publicPath === 'string' && publicPath !== 'auto'
                ? publicPath
                : config.output.assetPrefix;
            const manifest = createUiManifest(
              definition,
              assetPrefix,
              mf,
              options.csp,
              { inline: useInline },
            );
            for (const name of localEntries) {
              const htmlPath = environment.htmlPaths[name];
              const html = htmlPath && compilation.getAsset(htmlPath);
              if (!html) throw new Error(`Missing MCP HTML output: ${name}`);
              await writeArtifact(
                path.join(output, 'ui', `${name}.html`),
                html.source.source(),
              );
            }
            for (const [name, html] of inlineHtml) {
              await writeArtifact(
                path.join(output, 'ui', `${name}.html`),
                html,
              );
            }
            for (const [name, html] of shellHtml) {
              await writeArtifact(
                path.join(output, 'ui', `${name}.html`),
                html,
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

    api.onDevCompileDone(async ({ isFirstCompile }) => {
      if (!isFirstCompile) return;
      const ctx = api.getAppContext();
      if (!['dev', 'start'].includes(ctx.command)) return;
      const config = api.getNormalizedConfig();
      const useInline = shouldInline(options.inline, ctx.command);
      const mcpUrl = resolveMcpDevUrl(
        ctx.port,
        config as {
          dev?: { https?: unknown };
          bff?: { prefix?: string | string[] };
        },
      );
      await writeArtifact(
        path.join(ctx.internalDirectory, 'mcp-apps/dev-server.json'),
        `${JSON.stringify({ url: mcpUrl, inline: useInline }, null, 2)}\n`,
      );
      if (useInline) {
        const connector = {
          mcpServers: {
            app: {
              command: process.execPath,
              args: [stdioBinFile(), '--cwd', ctx.appDirectory],
            },
          },
        };
        console.log(
          `\nMCP Apps (inline) stdio connector:\n${JSON.stringify(connector, null, 2)}\n`,
        );
      }
    });
  },
});
export default mcpAppsPlugin;
