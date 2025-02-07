/**
 * The plugin is developing, ignore it now
 */
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
      // AsyncDependenciesBlock,
      RuntimeGlobals,
      RuntimeModule,
      WebpackError,
      // dependencies: { ModuleDependency, NullDependency },
      sources: { RawSource },
    } = compiler.webpack;

    const ssrManifest: SSRManifest = {
      moduleMap: {},
      moduleLoading: null,
      styles: [],
    };

    // class ClientReferenceDependency extends ModuleDependency {
    //   override get type(): string {
    //     return `client-reference`;
    //   }
    // }

    const getEntryModule = (compilation: Webpack.Compilation): Module[] => {
      const entryModules: Webpack.Module[] = [];

      for (const [, entryValue] of compilation.entries.entries()) {
        // const entryDependency = entryValue.dependencies.find(
        //   dependency => dependency.constructor.name === `EntryDependency`,
        // );

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
        const dependency = EntryPlugin.createDependency(resourcePath, {
          name: resourcePath,
        });
        const entries = compilation.entries.entries();

        for (const [entryName, entry] of entries) {
          if (hasExtension(entryName)) {
            continue;
          }

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
            addClientReferencesChunks(compilation, entryModule, callback);
          }
        }
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
          const { chunkGraph, moduleGraph, modules } = compilation;

          for (const module of modules) {
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
