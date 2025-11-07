import type Webpack from 'webpack';
import type { Module } from 'webpack';
import {
  type ClientManifest,
  type ClientReference,
  type ClientReferencesMap,
  type ImportManifestEntry,
  type SSRManifest,
  sharedData,
} from '../common';

export interface RscClientPluginOptions {
  readonly clientManifestFilename?: string;
  readonly ssrManifestFilename?: string;
}

export class RscClientPlugin {
  private clientReferencesMap: ClientReferencesMap = new Map();
  private clientManifestFilename: string;
  private ssrManifestFilename: string;
  private styles?: Set<string>;
  private dependencies: Webpack.Dependency[] = [];
  private includedResources: Set<string> = new Set();

  constructor(options?: RscClientPluginOptions) {
    this.clientManifestFilename =
      options?.clientManifestFilename || `react-client-manifest.json`;

    this.ssrManifestFilename =
      options?.ssrManifestFilename || `react-ssr-manifest.json`;
  }

  apply(compiler: Webpack.Compiler): void {
    const {
      AsyncDependenciesBlock,
      RuntimeGlobals,
      WebpackError,
      dependencies: { ModuleDependency, NullDependency },
      sources: { RawSource },
    } = compiler.webpack;

    const ssrManifest: SSRManifest = {
      moduleMap: {},
      moduleLoading: null,
      styles: [],
    };

    class ClientReferenceDependency extends ModuleDependency {
      override get type(): string {
        return `client-reference`;
      }
    }

    const getEntryModule = (compilation: Webpack.Compilation): Module[] => {
      const entryModules: Webpack.Module[] = [];

      for (const [, entryValue] of compilation.entries.entries()) {
        const entryDependency = entryValue.dependencies.find(dependency =>
          dependency.constructor.name.endsWith('EntryDependency'),
        );

        if (!entryDependency) {
          compilation.errors.push(
            new WebpackError(`Could not find an entry dependency.`),
          );
          continue;
        }

        const resolvedModule =
          compilation.moduleGraph.getResolvedModule(entryDependency);

        if (resolvedModule) {
          entryModules.push(resolvedModule);
        }
      }

      if (entryModules.length === 0) {
        compilation.errors.push(
          new WebpackError(`Could not find any entries in the compilation.`),
        );
        return [];
      }

      return entryModules;
    };

    const addClientReferencesBlocks = (entryModule: Webpack.Module) => {
      if (!entryModule) {
        if (process.env.DEBUG_RSC_CLIENT) {
          console.warn(
            '[RscClientPlugin] addClientReferencesBlocks: entryModule is null/undefined',
          );
        }
        return;
      }

      let index = 0;
      const resourceSet = new Set<string>();
      for (const key of this.clientReferencesMap.keys()) resourceSet.add(key);
      for (const key of this.includedResources) resourceSet.add(key);

      if (process.env.DEBUG_RSC_CLIENT) {
        console.log(
          '[RscClientPlugin] addClientReferencesBlocks: processing',
          resourceSet.size,
          'resources',
        );
      }

      for (const resourcePath of resourceSet) {
        if (!resourcePath || typeof resourcePath !== 'string') {
          if (process.env.DEBUG_RSC_CLIENT) {
            console.warn(
              '[RscClientPlugin] skipping invalid resourcePath:',
              resourcePath,
            );
          }
          continue;
        }
        const chunkName = `client${index++}`;
        const block = new AsyncDependenciesBlock(
          { name: chunkName },
          undefined,
          resourcePath,
        );
        const dep = new ClientReferenceDependency(resourcePath);
        block.addDependency(dep);
        entryModule.addBlock(block);
        this.dependencies.push(dep);
      }
      // Styles collected later from assets for SSR; no CSS injection here.
    };

    // Do not add entries directly to avoid CSS child compilation issues

    // Narrow type for loader-published sharedData records
    type ClientRefRecord = {
      readonly type: 'client';
      readonly resourcePath: string;
      readonly clientReferences: ClientReference[];
    };

    const isClientRefRecord = (value: unknown): value is ClientRefRecord => {
      if (!value || typeof value !== 'object') return false;
      const obj = value as Record<string, unknown>;
      if (obj.type !== 'client') return false;
      if (typeof obj.resourcePath !== 'string') return false;
      const list = obj.clientReferences as unknown;
      if (!Array.isArray(list)) return false;
      // Basic element shape check (id + exportName)
      return list.every(
        item =>
          item &&
          typeof (item as ClientReference).exportName === 'string' &&
          (typeof (item as ClientReference).id === 'string' ||
            typeof (item as ClientReference).id === 'number'),
      );
    };

    // Detect Module Federation to avoid mutating container entry modules
    const isMfApp = (() => {
      try {
        const plugins =
          (compiler.options && (compiler.options as any).plugins) || [];
        return plugins.some((p: any) => {
          const ctorName = p?.constructor?.name;
          return (
            typeof ctorName === 'string' &&
            ctorName.toLowerCase().includes('modulefederation')
          );
        });
      } catch {
        return false;
      }
    })();

    compiler.hooks.finishMake.tapAsync(
      RscClientPlugin.name,
      (compilation, callback) => {
        // Try to hydrate from sharedData in case server compiler published during module loading
        const tryHydrate = () => {
          try {
            const map = sharedData.get<ClientReferencesMap>(
              'clientReferencesMap',
            );
            if (
              map &&
              map.size > 0 &&
              (!this.clientReferencesMap || this.clientReferencesMap.size === 0)
            ) {
              this.clientReferencesMap = map;
            }
            // Also try loader keys fallback
            if (
              !this.clientReferencesMap ||
              this.clientReferencesMap.size === 0
            ) {
              const derived: ClientReferencesMap = new Map();
              const store = sharedData.store;
              const entries: Iterable<[unknown, unknown]> =
                store && typeof store === 'object' && 'forEach' in store
                  ? (store as Map<unknown, unknown>).entries()
                  : [];
              for (const [key, val] of entries) {
                if (typeof key !== 'string' || !key.endsWith(':client-refs'))
                  continue;
                if (!isClientRefRecord(val)) continue;
                derived.set(val.resourcePath, val.clientReferences);
              }
              if (derived.size > 0) {
                this.clientReferencesMap = derived;
                if (process.env.DEBUG_RSC_CLIENT) {
                  console.log(
                    '[RscClientPlugin finishMake] derived from loader keys:',
                    Array.from(derived.keys()),
                  );
                }
              }
            }
          } catch {}
        };

        if (compiler.watchMode) {
          tryHydrate();
          const entryModules = getEntryModule(compilation);
          if (!isMfApp) {
            for (const entryModule of entryModules) {
              // Remove stale client reference blocks
              entryModule.blocks = entryModule.blocks.filter(block =>
                block.dependencies.some(
                  dependency =>
                    !(dependency instanceof ClientReferenceDependency) ||
                    this.clientReferencesMap.has(dependency.request),
                ),
              );
              addClientReferencesBlocks(entryModule);
            }
          }
          callback();
        } else {
          // Non-watch mode: poll for clientReferencesMap to be published by server compiler
          const deadline = Date.now() + 4000;
          let attemptCount = 0;
          const pollAndProceed = () => {
            attemptCount++;
            tryHydrate();

            if (process.env.DEBUG_RSC_CLIENT && attemptCount % 5 === 1) {
              console.log(
                `[RscClientPlugin finishMake] attempt ${attemptCount}, map size:`,
                this.clientReferencesMap.size,
              );
            }

            if (this.clientReferencesMap && this.clientReferencesMap.size > 0) {
              if (process.env.DEBUG_RSC_CLIENT) {
                console.log(
                  '[RscClientPlugin finishMake] successfully hydrated, keys:',
                  Array.from(this.clientReferencesMap.keys()),
                );
              }
              // Add client reference blocks to entry modules (non-MF only)
              const entryModules = getEntryModule(compilation);
              if (!isMfApp) {
                for (const entryModule of entryModules) {
                  addClientReferencesBlocks(entryModule);
                }
              }
              callback();
            } else if (Date.now() < deadline) {
              setTimeout(pollAndProceed, 50);
            } else {
              if (process.env.DEBUG_RSC_CLIENT) {
                console.log(
                  '[RscClientPlugin finishMake] gave up waiting, proceeding with empty map',
                );
              }
              callback();
            }
          };
          pollAndProceed();
        }
      },
    );

    compiler.hooks.compilation.tap(
      RscClientPlugin.name,
      (compilation, { normalModuleFactory }) => {
        // Skip child compilers (e.g., HtmlWebpackPlugin) that don't have a normalModuleFactory
        if (!normalModuleFactory) {
          return;
        }

        compilation.dependencyFactories.set(
          ClientReferenceDependency,
          normalModuleFactory,
        );

        compilation.dependencyTemplates.set(
          ClientReferenceDependency,
          new NullDependency.Template(),
        );

        class EntryNameRuntimeModule extends compiler.webpack.RuntimeModule {
          private entryName: string;
          constructor(entryName: string) {
            super('entry-name', 10); // Set a higher stage to ensure priority execution
            this.entryName = entryName;
          }

          generate() {
            return `window.__MODERN_JS_ENTRY_NAME="${this.entryName}";`;
          }
        }

        compilation.hooks.runtimeRequirementInTree
          .for(RuntimeGlobals.ensureChunk)
          .tap(RscClientPlugin.name, (chunk, set) => {
            Array.from(compilation.entrypoints.entries()).forEach(
              ([entryName, entrypoint]) => {
                if (entrypoint.chunks.includes(chunk)) {
                  compilation.addRuntimeModule(
                    chunk,
                    new EntryNameRuntimeModule(entryName),
                  );
                }
              },
            );
          });
      },
    );

    compiler.hooks.thisCompilation.tap(
      RscClientPlugin.name,
      (compilation, { normalModuleFactory }) => {
        // Skip child compilers (e.g., HtmlWebpackPlugin) that don't have a normalModuleFactory
        if (!normalModuleFactory) {
          return;
        }

        // Initialize with safe defaults if sharedData is not available (child compilers)
        this.styles =
          sharedData.get<Set<string>>('styles') || new Set<string>();
        this.clientReferencesMap =
          sharedData.get<ClientReferencesMap>('clientReferencesMap') ||
          new Map();

        // Fallback: if the server plugin hasn't published clientReferencesMap
        // yet, derive it from per-module ":client-refs" keys published by the
        // server loader during module loading. This helps initial builds where
        // the client and server compilers run concurrently.
        if (!this.clientReferencesMap || this.clientReferencesMap.size === 0) {
          const derived: ClientReferencesMap = new Map();
          try {
            const store = sharedData.store;
            const entries: Iterable<[unknown, unknown]> =
              store && typeof store === 'object' && 'forEach' in store
                ? (store as Map<unknown, unknown>).entries()
                : [];
            for (const [key, val] of entries) {
              if (typeof key !== 'string' || !key.endsWith(':client-refs'))
                continue;
              if (!isClientRefRecord(val)) continue;
              const { resourcePath, clientReferences } = val;
              derived.set(resourcePath, clientReferences);
            }
          } catch {}
          if (derived.size > 0) {
            this.clientReferencesMap = derived;
            if (process.env.DEBUG_RSC_CLIENT) {
              console.log(
                '[RscClientPlugin] derived from loader keys:',
                Array.from(derived.keys()),
              );
            }
          }
        }
        if (process.env.DEBUG_RSC_CLIENT) {
          console.log(
            '[RscClientPlugin] clientReferencesMap size:',
            this.clientReferencesMap.size,
          );
        }
        // Pre-scan src for 'use client' to seed resource paths early for non-MF webpack
        try {
          if (
            !this.clientReferencesMap ||
            this.clientReferencesMap.size === 0
          ) {
            const fs = require('fs') as typeof import('fs');
            const path = require('path') as typeof import('path');
            const root = compiler.context || process.cwd();
            const srcDir = path.join(root, 'src');
            const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
            const scan = (dir: string) => {
              try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const ent of entries) {
                  const full = path.join(dir, ent.name);
                  if (ent.isDirectory()) {
                    scan(full);
                  } else if (exts.has(path.extname(ent.name))) {
                    try {
                      const buf = fs.readFileSync(full, 'utf-8');
                      // quick directive check near top
                      const head = buf.slice(0, 256);
                      if (/['\"]use client['\"];?/.test(head)) {
                        this.includedResources.add(full);
                      }
                    } catch {}
                  }
                }
              } catch {}
            };
            if (fs.existsSync(srcDir)) scan(srcDir);
          }
        } catch {}

        const onNormalModuleFactoryParser = (
          parser: Webpack.javascript.JavascriptParser,
        ) => {
          parser.hooks.program.tap(RscClientPlugin.name, () => {
            // Re-hydrate from sharedData at parse time in case server loader
            // published client refs after thisCompilation hook ran
            try {
              const map = sharedData.get<ClientReferencesMap>(
                'clientReferencesMap',
              );
              if (map && map.size > 0) {
                this.clientReferencesMap = map;
              } else if (
                !this.clientReferencesMap ||
                this.clientReferencesMap.size === 0
              ) {
                // Fallback: read from loader-published keys
                const derived: ClientReferencesMap = new Map();
                const store = sharedData.store;
                const entries: Iterable<[unknown, unknown]> =
                  store && typeof store === 'object' && 'forEach' in store
                    ? (store as Map<unknown, unknown>).entries()
                    : [];
                for (const [key, val] of entries) {
                  if (typeof key !== 'string' || !key.endsWith(':client-refs'))
                    continue;
                  if (!isClientRefRecord(val)) continue;
                  derived.set(val.resourcePath, val.clientReferences);
                }
                if (derived.size > 0) {
                  this.clientReferencesMap = derived;
                  if (process.env.DEBUG_RSC_CLIENT) {
                    console.log(
                      '[RscClientPlugin parser] hydrated from loader keys:',
                      Array.from(derived.keys()),
                    );
                  }
                }
              }
            } catch {}

            const entryModules = getEntryModule(compilation);

            if (!isMfApp) {
              for (const entryModule of entryModules) {
                if (entryModule === parser.state.module) {
                  addClientReferencesBlocks(entryModule);
                }
              }
            }
          });
        };

        normalModuleFactory.hooks.parser
          .for(`javascript/auto`)
          .tap(`HarmonyModulesPlugin`, onNormalModuleFactoryParser);

        normalModuleFactory.hooks.parser
          .for(`javascript/dynamic`)
          .tap(`HarmonyModulesPlugin`, onNormalModuleFactoryParser);

        normalModuleFactory.hooks.parser
          .for(`javascript/esm`)
          .tap(`HarmonyModulesPlugin`, onNormalModuleFactoryParser);

        compilation.hooks.additionalTreeRuntimeRequirements.tap(
          RscClientPlugin.name,
          (_chunk, runtimeRequirements) => {
            runtimeRequirements.add(RuntimeGlobals.ensureChunk);
            runtimeRequirements.add(RuntimeGlobals.compatGetDefaultExport);
          },
        );

        compilation.hooks.processAssets.tap(RscClientPlugin.name, () => {
          const clientManifest: ClientManifest = {};
          const { chunkGraph, moduleGraph, modules } =
            compilation as unknown as Webpack.Compilation & {
              modules: Iterable<Webpack.Module>;
            };

          // Build manifests from explicitly added client-reference dependencies
          for (const dependency of this.dependencies) {
            const module = moduleGraph.getModule(dependency);
            if (!module) continue;
            const resourcePath = module.nameForCondition();
            const clientReferences = resourcePath
              ? this.clientReferencesMap.get(resourcePath)
              : undefined;
            if (!clientReferences) continue;

            const moduleId = chunkGraph.getModuleId(module);
            const ssrModuleMetaData: Record<string, ImportManifestEntry> = {};

            const chunksSet = new Set<Webpack.Chunk>();
            for (const chunk of chunkGraph.getModuleChunksIterable(module)) {
              chunksSet.add(chunk);
            }

            const chunks: (string | number)[] = [];
            const styles: string[] = [];
            for (const chunk of chunksSet) {
              if (chunk.id && !chunk.isOnlyInitial()) {
                for (const file of chunk.files) {
                  if (file.endsWith('.js')) {
                    chunks.push(chunk.id, file);
                  }
                }
              }
            }

            for (const { id, exportName, ssrId } of clientReferences) {
              clientManifest[id] = {
                id: moduleId!,
                name: exportName,
                chunks,
                styles,
              };

              if (ssrId) {
                ssrModuleMetaData[exportName] = {
                  id: ssrId,
                  name: exportName,
                  chunks: [],
                };
              }
            }

            ssrManifest.moduleMap[moduleId!] = ssrModuleMetaData;
          }

          // Fallback: also scan all modules to catch any client refs that were
          // included via other means (e.g., optimization/concat changes).
          for (const mod of modules) {
            const resourcePath = mod.nameForCondition();
            const clientReferences = resourcePath
              ? this.clientReferencesMap.get(resourcePath)
              : undefined;
            if (!clientReferences) continue;
            const moduleId = chunkGraph.getModuleId(mod);
            const ssrModuleMetaData: Record<string, ImportManifestEntry> = {};
            const chunksSet = new Set<Webpack.Chunk>();
            for (const chunk of chunkGraph.getModuleChunksIterable(mod)) {
              chunksSet.add(chunk);
            }
            const chunks: (string | number)[] = [];
            const styles: string[] = [];
            for (const chunk of chunksSet) {
              if (chunk.id && !chunk.isOnlyInitial()) {
                for (const file of chunk.files) {
                  if (file.endsWith('.js')) {
                    chunks.push(chunk.id, file);
                  }
                }
              }
            }
            for (const { id, exportName, ssrId } of clientReferences) {
              if (!clientManifest[id]) {
                clientManifest[id] = {
                  id: moduleId!,
                  name: exportName,
                  chunks,
                  styles,
                };
              }
              if (ssrId) {
                ssrModuleMetaData[exportName] = {
                  id: ssrId,
                  name: exportName,
                  chunks: [],
                };
              }
            }
            ssrManifest.moduleMap[moduleId!] = {
              ...(ssrManifest.moduleMap[moduleId!] || {}),
              ...ssrModuleMetaData,
            };
          }

          compilation.emitAsset(
            this.clientManifestFilename,
            new RawSource(JSON.stringify(clientManifest, null, 2), false),
          );

          const { crossOriginLoading, publicPath = `` } =
            compilation.outputOptions;

          ssrManifest.moduleLoading = {
            // https://github.com/webpack/webpack/blob/87660921808566ef3b8796f8df61bd79fc026108/lib/runtime/PublicPathRuntimeModule.js#L30-L32
            prefix: compilation.getPath(publicPath, {
              hash: compilation.hash ?? `XXXX`,
            }),
            crossOrigin: crossOriginLoading
              ? crossOriginLoading === `use-credentials`
                ? crossOriginLoading
                : ``
              : undefined,
          };

          if (this.styles && this.styles.size > 0) {
            const assets = compilation.getAssets();
            const cssAsset = assets.find(asset => {
              return asset.name.endsWith('.css');
            });
            if (cssAsset) {
              ssrManifest.styles.push(cssAsset.name);
            }
          }

          compilation.emitAsset(
            this.ssrManifestFilename,
            new RawSource(JSON.stringify(ssrManifest, null, 2), false),
          );
        });
      },
    );
  }
}
