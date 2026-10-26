import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createRsbuild } from '@rsbuild/core';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import {
  validateViewsConfig,
  type McpViewsConfig,
} from '@modern-js/mcp-apps/manifest';
import { createUiManifest, viewEntryName, type MfManifest } from './build';

export interface McpAppsPluginOptions {
  /** JSON UI configuration, relative to the application root. */
  views?: string;
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
    const attachedCompilers = new WeakSet<object>();
    const shellHtml = new Map<string, string>();
    const shellAssets = new Map<string, Buffer>();
    let buildShell: (() => Promise<void>) | undefined;
    let shellDirty = true;
    let shellBuild: Promise<void> | undefined;
    const localEntries = new Set<string>();
    const configPath = () =>
      path.resolve(
        api.getAppContext().appDirectory,
        options.views ?? 'mcp-views.json',
      );
    api.addWatchFiles(() => [configPath()]);
    api.modifyEntrypoints(async ({ entrypoints }) => {
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
        view => typeof view !== 'string',
      );
      localEntries.clear();
      shellHtml.clear();
      shellAssets.clear();
      buildShell = undefined;
      shellDirty = true;
      const shellEntries: Record<string, string> = {};
      for (const [name, source] of Object.entries(definition.views)) {
        if (typeof source !== 'string') continue;
        const entryName = viewEntryName(name);
        if (entrypoints.some(entry => entry.entryName === entryName))
          throw new Error(
            `MCP entry conflicts with application entry: ${entryName}`,
          );
        const entry = path.join(
          ctx.internalDirectory,
          'mcp-apps/entries',
          `${entryName}.jsx`,
        );
        const mountEntry = path.join(
          path.dirname(entry),
          `${entryName}-mount.jsx`,
        );
        await writeArtifact(
          mountEntry,
          `import React from ${JSON.stringify(appRequire.resolve('react'))};\nimport { createRoot } from ${JSON.stringify(appRequire.resolve('react-dom/client'))};\nimport { createMcpView } from ${JSON.stringify(appRequire.resolve('@modern-js/mcp-apps/react'))};\nimport View, * as viewModule from ${JSON.stringify(path.resolve(path.dirname(configPath()), source))};\ncreateRoot(document.getElementById('root')).render(React.createElement(createMcpView(View, ${JSON.stringify({ name, version: '1.0.0' })}, Reflect.get(viewModule, 'mcpCapabilities'))));\n`,
        );
        // Keep MF shared initialization asynchronous without loading the framework's
        // page runtime, which reads cookies unavailable in an opaque app sandbox.
        await writeArtifact(entry, `import(${JSON.stringify(mountEntry)});\n`);
        localEntries.add(entryName);
        entrypoints.push({
          entryName,
          entry,
          isMainEntry: false,
          isAutoMount: false,
          absoluteEntryDir: path.dirname(entry),
        });
      }
      console.log('-------entrypoints', entrypoints);
      if (needsMf) {
        shellEntries['mcp-shell'] = appRequire.resolve(
          '@modern-js/mcp-apps/internal/mf-entry',
        );
      }
      console.log('-----shellEntries', shellEntries);
      if (Object.keys(shellEntries).length) {
        const shellOutput = path.join(ctx.internalDirectory, 'mcp-apps/shell');
        const config = api.getNormalizedConfig();
        const development = ['dev', 'start'].includes(ctx.command);
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
      // Local cards use the application multi-entry pipeline. Only the MF host is isolated.
      return { entrypoints };
    });
    api.modifyRsbuildConfig(config => {
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
      api.onBeforeRestart(
        () =>
          new Promise<void>((resolve, reject) =>
            compiler.close(error => (error ? reject(error) : resolve())),
          ),
      );
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
            const config = api.getNormalizedConfig();
            const manifest = createUiManifest(
              definition,
              development ? config.dev.assetPrefix : config.output.assetPrefix,
              mf,
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
  },
});
export default mcpAppsPlugin;
