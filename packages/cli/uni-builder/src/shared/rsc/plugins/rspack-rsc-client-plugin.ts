import path from 'path';
import type Webpack from 'webpack';
import type { Module } from 'webpack';
import {
  type ClientManifest,
  type ClientReferencesMap,
  type ImportManifestEntry,
  type SSRManifest,
  sharedData,
} from '../common';

type ClientRefRecord = {
  type: 'client';
  resourcePath: string;
  clientReferences: {
    id: string | number;
    exportName: string;
    ssrId?: string | number;
  }[];
};

const isClientRefRecord = (val: unknown): val is ClientRefRecord => {
  if (!val || typeof val !== 'object') return false;
  const rec = val as Record<string, unknown>;
  return (
    rec.type === 'client' &&
    typeof rec.resourcePath === 'string' &&
    Array.isArray(rec.clientReferences)
  );
};
export interface RscClientPluginOptions {
  readonly clientManifestFilename?: string;
  readonly ssrManifestFilename?: string;
}

const hasExtension = (filePath: string) => {
  return path.extname(filePath) !== '';
};

export class RspackRscClientPlugin {
  private clientReferencesMap: ClientReferencesMap = new Map();
  private clientManifestFilename: string;
  private ssrManifestFilename: string;
  private styles?: Set<string>;
  private dependencies: any[] = [];

  constructor(options?: RscClientPluginOptions) {
    this.clientManifestFilename =
      options?.clientManifestFilename || `react-client-manifest.json`;

    this.ssrManifestFilename =
      options?.ssrManifestFilename || `react-ssr-manifest.json`;
  }

  apply(compiler: Webpack.Compiler): void {
    const {
      EntryPlugin,
      RuntimeGlobals,
      RuntimeModule,
      WebpackError,
      sources: { RawSource },
    } = compiler.webpack;

    const ssrManifest: SSRManifest = {
      moduleMap: {},
      moduleLoading: null,
      styles: [],
    };

    const getEntryModule = (compilation: Webpack.Compilation): Module[] => {
      const entryModules: Webpack.Module[] = [];

      for (const [, entryValue] of compilation.entries.entries()) {
        const entryDependency = entryValue.dependencies[0];

        if (!entryDependency) {
          compilation.errors.push(
            new WebpackError(`Could not find an entry dependency.`),
          );
          continue;
        }

        const resolvedModule =
          compilation.moduleGraph.getModule(entryDependency);

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

    const addClientReferencesChunks = (
      compilation: Webpack.Compilation,
      entryModule: Webpack.Module,
      callback: (err: any | null) => void,
    ) => {
      const promises = [];
      [...this.clientReferencesMap.keys()].forEach((resourcePath, index) => {
        const entries = compilation.entries.entries();

        for (const [entryName, entry] of entries) {
          const runtimeName = entry.options.runtime || entryName;
          if (hasExtension(entryName)) {
            continue;
          }

          const dependency = EntryPlugin.createDependency(resourcePath, {
            name: resourcePath,
          });

          promises.push(
            new Promise((resolve, reject) => {
              compilation.addInclude(
                compiler.context,
                dependency,
                {
                  name: entryName,
                },
                (error, module) => {
                  if (error) {
                    reject(error);
                  } else {
                    compilation.moduleGraph
                      .getExportsInfo(module!)
                      .setUsedInUnknownWay(runtimeName);
                    this.dependencies.push(dependency);
                    resolve(undefined);
                  }
                },
              );
            }),
          );
        }
      });

      if (this.styles && this.styles.size > 0) {
        for (const style of this.styles) {
          const dependency = EntryPlugin.createDependency(style, {
            name: style,
          });
          promises.push(
            new Promise((resolve, reject) => {
              compilation.addInclude(
                compiler.context,
                dependency,
                { name: undefined },
                (error, module) => {
                  if (error) {
                    reject(error);
                  } else {
                    compilation.moduleGraph
                      .getExportsInfo(module!)
                      .setUsedInUnknownWay(undefined);
                    this.dependencies.push(dependency);
                    resolve(undefined);
                  }
                },
              );
            }),
          );
        }
      }

      Promise.all(promises)
        .then(() => callback(null))
        .catch(error => callback(error));
    };

    compiler.hooks.finishMake.tapAsync(
      RspackRscClientPlugin.name,
      (compilation, callback) => {
        // Attempt to hydrate maps as early as possible so we can include
        // client references during this finishMake phase.
        try {
          const styles = sharedData.get('styles') as Set<string> | undefined;
          const map = sharedData.get('clientReferencesMap') as
            | ClientReferencesMap
            | undefined;
          if (styles && (!this.styles || this.styles.size === 0)) {
            this.styles = styles;
          }
          if (map && this.clientReferencesMap.size === 0) {
            this.clientReferencesMap = map;
          }
          // Fallback: derive from sharedData.store when map still empty.
          // This reads individual ":client-refs" keys published by the loader
          // during server compilation's module loading phase.
          if (
            !this.clientReferencesMap ||
            this.clientReferencesMap.size === 0
          ) {
            const derived: ClientReferencesMap = new Map();
            try {
              const store: Map<string, unknown> =
                (sharedData as unknown as { store: Map<string, unknown> })
                  .store || new Map();
              for (const [key, raw] of store) {
                if (
                  typeof key === 'string' &&
                  key.endsWith(':client-refs') &&
                  isClientRefRecord(raw)
                ) {
                  derived.set(raw.resourcePath, raw.clientReferences);
                }
              }
            } catch {}
            if (derived.size > 0) {
              this.clientReferencesMap = derived;
              if (process.env.DEBUG_RSC_CLIENT) {
                console.log(
                  '[RspackRscClientPlugin] derived from loader keys:',
                  Array.from(derived.keys()),
                );
              }
            }
          }
        } catch {}
        if (process.env.DEBUG_RSC_CLIENT) {
          // eslint-disable-next-line no-console
          console.log(
            '[RspackRscClientPlugin] clientReferencesMap size:',
            this.clientReferencesMap ? this.clientReferencesMap.size : 0,
          );
        }
        const proceed = () => {
          const entryModules = getEntryModule(compilation);

          for (const entryModule of entryModules) {
            if (entryModule) {
              addClientReferencesChunks(compilation, entryModule, callback);
            }
          }
        };

        // If map is empty here, give the server compiler a brief chance to
        // publish it (finishMake races in multi-compiler builds). This avoids
        // writing an empty client manifest in single-shot builds.
        if (!this.clientReferencesMap || this.clientReferencesMap.size === 0) {
          const deadline = Date.now() + 1500;
          let attemptCount = 0;
          const tryHydrate = () => {
            attemptCount++;
            try {
              const map = sharedData.get('clientReferencesMap') as
                | ClientReferencesMap
                | undefined;
              if (process.env.DEBUG_RSC_CLIENT && attemptCount % 5 === 1) {
                console.log(
                  `[RspackRscClientPlugin] tryHydrate attempt ${attemptCount}, map size:`,
                  map ? map.size : 'undefined',
                );
              }
              if (map && map.size > 0) {
                this.clientReferencesMap = map;
                if (process.env.DEBUG_RSC_CLIENT) {
                  console.log(
                    '[RspackRscClientPlugin] successfully hydrated, keys:',
                    Array.from(map.keys()),
                  );
                }
              }
            } catch (err) {
              if (process.env.DEBUG_RSC_CLIENT) {
                console.log('[RspackRscClientPlugin] tryHydrate error:', err);
              }
            }

            if (this.clientReferencesMap && this.clientReferencesMap.size > 0) {
              proceed();
            } else if (Date.now() < deadline) {
              setTimeout(tryHydrate, 50);
            } else {
              if (process.env.DEBUG_RSC_CLIENT) {
                console.log(
                  '[RspackRscClientPlugin] gave up waiting, proceeding with empty map',
                );
              }
              proceed();
            }
          };
          return tryHydrate();
        }

        proceed();
      },
    );

    compiler.hooks.compilation.tap(
      RspackRscClientPlugin.name,
      (compilation, { normalModuleFactory }) => {
        class EntryNameRuntimeModule extends RuntimeModule {
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
          .tap(RspackRscClientPlugin.name, (chunk, set) => {
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
      RspackRscClientPlugin.name,
      (compilation, { normalModuleFactory }) => {
        // Initialize with safe defaults if sharedData is not available (child compilers)
        this.styles =
          (sharedData.get('styles') as Set<string>) || new Set<string>();
        this.clientReferencesMap =
          (sharedData.get('clientReferencesMap') as ClientReferencesMap) ||
          new Map();

        // Fallback: if the server plugin hasn't published clientReferencesMap
        // yet, derive it from per-module ":client-refs" keys published by the
        // server loader during module loading. This helps initial builds where
        // the client and server compilers run concurrently.
        if (!this.clientReferencesMap || this.clientReferencesMap.size === 0) {
          const derived: ClientReferencesMap = new Map();
          try {
            const store: Map<string, unknown> =
              (sharedData as unknown as { store: Map<string, unknown> })
                .store || new Map();
            for (const [key, raw] of store) {
              if (
                typeof key === 'string' &&
                key.endsWith(':client-refs') &&
                isClientRefRecord(raw)
              ) {
                derived.set(raw.resourcePath, raw.clientReferences);
              }
            }
          } catch {}
          if (derived.size > 0) {
            this.clientReferencesMap = derived;
          }
        }

        compilation.hooks.additionalTreeRuntimeRequirements.tap(
          RspackRscClientPlugin.name,
          (_chunk, runtimeRequirements) => {
            runtimeRequirements.add(RuntimeGlobals.ensureChunkHandlers);
            runtimeRequirements.add(RuntimeGlobals.ensureChunk);
            runtimeRequirements.add(RuntimeGlobals.compatGetDefaultExport);
          },
        );

        compilation.hooks.processAssets.tap(RspackRscClientPlugin.name, () => {
          const clientManifest: ClientManifest = {};
          const { chunkGraph, moduleGraph } = compilation;

          // use dependencies, not modules
          // so that the bundler can get the moduleId if the dependency points to a different module when optimizing like concat modules.
          for (const dependency of this.dependencies) {
            const module = moduleGraph.getModule(dependency);
            if (!module) {
              continue;
            }
            const resourcePath = module.nameForCondition();

            const clientReferences = resourcePath
              ? this.clientReferencesMap.get(resourcePath)
              : undefined;

            if (clientReferences) {
              const moduleId = chunkGraph.getModuleId(module);

              const ssrModuleMetaData: Record<string, ImportManifestEntry> = {};

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
                  if (chunk.id) {
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
