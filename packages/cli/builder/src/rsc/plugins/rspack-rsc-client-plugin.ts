import path from 'path';
import type { Rspack } from '@rsbuild/core';
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

  apply(compiler: Rspack.Compiler): void {
    const {
      EntryPlugin,
      RuntimeGlobals,
      RuntimeModule,
      WebpackError,
      sources: { RawSource },
    } = compiler.rspack;

    const ssrManifest: SSRManifest = {
      moduleMap: {},
      moduleLoading: null,
      styles: [],
    };

    const getEntryModule = (
      compilation: Rspack.Compilation,
    ): Rspack.Module[] => {
      const entryModules: Rspack.Module[] = [];

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
      compilation: Rspack.Compilation,
      callback: (err: any | null) => void,
    ) => {
      const promises = [];
      [...this.clientReferencesMap.keys()].forEach(resourcePath => {
        const entries = compilation.entries.entries();

        for (const [entryName, entry] of entries) {
          const runtimeName = entry.options.runtime || entryName;
          if (hasExtension(entryName)) {
            continue;
          }

          const dependency = EntryPlugin.createDependency(resourcePath);

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
          const dependency = EntryPlugin.createDependency(style);
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
        const entryModules = getEntryModule(compilation);

        for (const entryModule of entryModules) {
          if (entryModule) {
            addClientReferencesChunks(compilation, callback);
          }
        }
      },
    );

    compiler.hooks.compilation.tap(RspackRscClientPlugin.name, compilation => {
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
        .tap(RspackRscClientPlugin.name, chunk => {
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
    });

    compiler.hooks.thisCompilation.tap(
      RspackRscClientPlugin.name,
      compilation => {
        this.styles = sharedData.get('styles') as Set<string>;
        this.clientReferencesMap = sharedData.get(
          'clientReferencesMap',
        ) as ClientReferencesMap;

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

                const chunksSet = new Set<Rspack.Chunk>();

                for (const chunk of (chunkGraph as any).getModuleChunksIterable(
                  module,
                )) {
                  chunksSet.add(chunk);
                }

                for (const connection of moduleGraph.getOutgoingConnections(
                  module,
                )) {
                  for (const chunk of (
                    chunkGraph as any
                  ).getModuleChunksIterable(connection.module)) {
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
            prefix: compilation.getPath(publicPath as string, {
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
