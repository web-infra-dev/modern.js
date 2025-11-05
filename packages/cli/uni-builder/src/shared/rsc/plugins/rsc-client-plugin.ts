import type Webpack from 'webpack';
import type { Module } from 'webpack';
import {
  type ClientManifest,
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

    const addClientReferencesChunks = (entryModule: Webpack.Module) => {
      [...this.clientReferencesMap.keys()].forEach((resourcePath, index) => {
        const chunkName = `client${index}`;

        const block = new AsyncDependenciesBlock(
          { name: chunkName },
          undefined,
          resourcePath,
        );

        block.addDependency(new ClientReferenceDependency(resourcePath));

        entryModule.addBlock(block);
      });
      if (this.styles && this.styles.size > 0) {
        for (const style of this.styles) {
          const dep = new ClientReferenceDependency(style);
          entryModule.addDependency(dep);
        }
      }
    };

    compiler.hooks.finishMake.tap(RscClientPlugin.name, compilation => {
      if (compiler.watchMode) {
        const entryModules = getEntryModule(compilation);

        for (const entryModule of entryModules) {
          // Remove stale client references.
          entryModule.blocks = entryModule.blocks.filter(block =>
            block.dependencies.some(
              dependency =>
                !(dependency instanceof ClientReferenceDependency) ||
                this.clientReferencesMap.has(dependency.request),
            ),
          );

          addClientReferencesChunks(entryModule);
        }
      }
    });

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
          (sharedData.get('styles') as Set<string>) || new Set<string>();
        this.clientReferencesMap =
          (sharedData.get('clientReferencesMap') as ClientReferencesMap) ||
          new Map();

        if (process.env.DEBUG_RSC_PLUGIN) {
          console.log(
            '[RscClientPlugin] thisCompilation - clientReferencesMap from sharedData, size:',
            this.clientReferencesMap?.size || 0,
          );
        }

        // Fallback: if the server plugin hasn't published clientReferencesMap
        // yet, derive it from per-module buildInfo entries stored in sharedData
        // by the server loader. This helps initial, non-watch builds where the
        // client and server compilers run concurrently.
        if (!this.clientReferencesMap || this.clientReferencesMap.size === 0) {
          const derived: ClientReferencesMap = new Map();
          try {
            for (const [key, val] of (sharedData as any).store || []) {
              if (
                typeof key === 'string' &&
                val &&
                typeof val === 'object' &&
                (val as any).type === 'client' &&
                (val as any).resourcePath &&
                (val as any).clientReferences
              ) {
                derived.set(
                  (val as any).resourcePath as string,
                  (val as any).clientReferences,
                );
              }
            }
          } catch {}
          if (process.env.DEBUG_RSC_PLUGIN) {
            console.log(
              '[RscClientPlugin] Derived clientReferencesMap size:',
              derived.size,
            );
            console.log(
              '[RscClientPlugin] Derived keys:',
              Array.from(derived.keys()),
            );
          }
          if (derived.size > 0) {
            this.clientReferencesMap = derived;
          }
        }
        const onNormalModuleFactoryParser = (
          parser: Webpack.javascript.JavascriptParser,
        ) => {
          parser.hooks.program.tap(RscClientPlugin.name, () => {
            const entryModules = getEntryModule(compilation);

            for (const entryModule of entryModules) {
              if (entryModule === parser.state.module) {
                addClientReferencesChunks(entryModule);
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

        compilation.hooks.processAssets.tap(
          {
            name: RscClientPlugin.name,
            stage:
              compiler.webpack.Compilation
                .PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER,
          },
          () => {
            // Re-read from sharedData here in case server build populated it after thisCompilation
            const latestClientReferencesMap = sharedData.get(
              'clientReferencesMap',
            ) as ClientReferencesMap;
            if (process.env.DEBUG_RSC_PLUGIN) {
              console.log(
                '[RscClientPlugin] processAssets - latestClientReferencesMap from sharedData:',
                latestClientReferencesMap?.size || 0,
              );
              console.log(
                '[RscClientPlugin] processAssets - current this.clientReferencesMap.size:',
                this.clientReferencesMap?.size || 0,
              );
            }
            if (
              latestClientReferencesMap &&
              latestClientReferencesMap.size > 0
            ) {
              this.clientReferencesMap = latestClientReferencesMap;
              if (process.env.DEBUG_RSC_PLUGIN) {
                console.log(
                  '[RscClientPlugin] processAssets - updated clientReferencesMap, size:',
                  latestClientReferencesMap.size,
                );
              }
            }

            const clientManifest: ClientManifest = {};
            const { chunkGraph, moduleGraph, modules } = compilation;

            for (const module of modules) {
              const resourcePath = module.nameForCondition();

              const clientReferences = resourcePath
                ? this.clientReferencesMap.get(resourcePath)
                : undefined;

              if (clientReferences) {
                const moduleId = chunkGraph.getModuleId(module);

                const ssrModuleMetaData: Record<string, ImportManifestEntry> =
                  {};

                for (const { id, exportName, ssrId } of clientReferences) {
                  const clientExportName = exportName;
                  const ssrExportName = exportName;

                  const chunksSet = new Set<Webpack.Chunk>();

                  for (const chunk of chunkGraph.getModuleChunksIterable(
                    module,
                  )) {
                    chunksSet.add(chunk);
                  }

                  for (const connection of moduleGraph.getOutgoingConnections(
                    module,
                  )) {
                    for (const chunk of chunkGraph.getModuleChunksIterable(
                      connection.module,
                    )) {
                      chunksSet.add(chunk);
                    }
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

                  clientManifest[id] = {
                    id: moduleId!,
                    name: clientExportName,
                    chunks,
                    styles,
                  };

                  if (ssrId) {
                    ssrModuleMetaData[clientExportName] = {
                      id: ssrId,
                      name: ssrExportName,
                      chunks: [],
                    };
                  }
                }

                ssrManifest.moduleMap[moduleId!] = ssrModuleMetaData;
              }
            }

            compilation.emitAsset(
              this.clientManifestFilename,
              new RawSource(JSON.stringify(clientManifest, null, 2), false),
            );

            if (process.env.DEBUG_RSC_PLUGIN) {
              console.log(
                '[RscClientPlugin] emitted client manifest with',
                Object.keys(clientManifest).length,
                'entries',
              );
            }

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
          },
        );
      },
    );

    // After compilation completes, check if server build has populated sharedData
    // and regenerate the client manifest if needed
    compiler.hooks.done.tapPromise(RscClientPlugin.name, async stats => {
      const latestClientReferencesMap = sharedData.get(
        'clientReferencesMap',
      ) as ClientReferencesMap;

      if (process.env.DEBUG_RSC_PLUGIN) {
        console.log(
          '[RscClientPlugin] done hook - sharedData clientReferencesMap size:',
          latestClientReferencesMap?.size || 0,
        );
      }

      if (!latestClientReferencesMap || latestClientReferencesMap.size === 0) {
        return; // Nothing to do
      }

      // If we found client references in sharedData, regenerate the manifest
      const compilation = stats.compilation;
      const { chunkGraph, moduleGraph, modules } = compilation;
      const clientManifest: ClientManifest = {};

      for (const module of modules) {
        const resourcePath = module.nameForCondition();
        const clientReferences = resourcePath
          ? latestClientReferencesMap.get(resourcePath)
          : undefined;

        if (clientReferences) {
          const moduleId = chunkGraph.getModuleId(module);

          for (const { id, exportName } of clientReferences) {
            const chunksSet = new Set<Webpack.Chunk>();

            for (const chunk of chunkGraph.getModuleChunksIterable(module)) {
              chunksSet.add(chunk);
            }

            for (const connection of moduleGraph.getOutgoingConnections(
              module,
            )) {
              for (const chunk of chunkGraph.getModuleChunksIterable(
                connection.module,
              )) {
                chunksSet.add(chunk);
              }
            }

            const chunks: (string | number)[] = [];
            for (const chunk of chunksSet) {
              if (chunk.id && !chunk.isOnlyInitial()) {
                for (const file of chunk.files) {
                  if (file.endsWith('.js')) {
                    chunks.push(chunk.id, file);
                  }
                }
              }
            }

            clientManifest[id] = {
              id: moduleId!,
              name: exportName,
              chunks,
              styles: [],
            };
          }
        }
      }

      if (Object.keys(clientManifest).length > 0) {
        const fs = require('fs');
        const path = require('path');
        const outputPath = path.join(
          compilation.outputOptions.path || '',
          this.clientManifestFilename,
        );

        if (process.env.DEBUG_RSC_PLUGIN) {
          console.log(
            '[RscClientPlugin] done hook - regenerating client manifest with',
            Object.keys(clientManifest).length,
            'entries',
          );
          console.log('[RscClientPlugin] done hook - writing to', outputPath);
        }

        await fs.promises.writeFile(
          outputPath,
          JSON.stringify(clientManifest, null, 2),
          'utf-8',
        );
      }
    });
  }
}
