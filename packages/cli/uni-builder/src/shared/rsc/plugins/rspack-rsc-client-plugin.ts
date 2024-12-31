import type Webpack from 'webpack';
import type { Module } from 'webpack';
import {
  type ClientManifest,
  type ClientReferencesMap,
  type ImportManifestEntry,
  type SSRManifest,
  getRscBuildInfo,
  sharedData,
} from '../common';

export interface RscClientPluginOptions {
  readonly clientManifestFilename?: string;
  readonly ssrManifestFilename?: string;
}

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

      console.log('eeeeeeeeeeeee', compilation.entries);
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

        console.log('resolvedModule1111111', resolvedModule);

        if (resolvedModule) {
          entryModules.push(resolvedModule);
        }
      }

      console.log('2222222222', entryModules.length);

      if (entryModules.length === 0) {
        compilation.errors.push(
          new WebpackError(`Could not find any entries in the compilation.`),
        );
        return [];
      }

      console.log('3333333333');
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
        promises.push(
          new Promise((resolve, reject) => {
            console.log('before addInclude');
            compilation.addInclude(
              compiler.context,
              dependency,
              { name: `client${index}` },
              (error, module) => {
                if (error) {
                  reject(error);
                } else {
                  this.dependencies.push(dependency);
                  resolve(undefined);
                }
              },
            );
            console.log('after addInclude');
          }),
        );
      });

      if (this.styles && this.styles.size > 0) {
        for (const style of this.styles) {
          const dependency = EntryPlugin.createDependency(style, {
            name: style,
          });
          promises.push(
            new Promise((resolve, reject) => {
              console.log('before addInclude');
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
              console.log('after addInclude');
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
        // if (compiler.watchMode) {
        //   const entryModules = getEntryModule(compilation);

        //   for (const entryModule of entryModules) {
        //     // Remove stale client references.
        //     entryModule.blocks = entryModule.blocks.filter(block =>
        //       block.dependencies.some(dependency => {
        //         const buildInfo = getRscBuildInfo(dependency.module);
        //         return (
        //           buildInfo.type !== 'client' ||
        //           this.clientReferencesMap.has(dependency.request)
        //         );
        //       }),
        //     );

        //     addClientReferencesChunks(compilation, entryModule, callback);
        //   }
        // }

        console.log('aaaaaaaaaaaa');
        const entryModules = getEntryModule(compilation);
        console.log('bbbbbbbbbbbb', entryModules);
        for (const entryModule of entryModules) {
          // Remove stale client references.
          // entryModule.blocks = entryModule.blocks.filter(block =>
          //   block.dependencies.some(dependency => {
          //     const buildInfo = getRscBuildInfo(dependency.module);
          //     return (
          //       buildInfo.type !== 'client' ||
          //       this.clientReferencesMap.has(dependency.request)
          //     );
          //   }),
          // );

          if (entryModule) {
            addClientReferencesChunks(compilation, entryModule, callback);
          }
        }
      },
    );

    compiler.hooks.compilation.tap(
      RspackRscClientPlugin.name,
      (compilation, { normalModuleFactory }) => {
        // compilation.dependencyFactories.set(
        //   ClientReferenceDependency,
        //   normalModuleFactory,
        // );

        // compilation.dependencyTemplates.set(
        //   ClientReferenceDependency,
        //   new NullDependency.Template(),
        // );

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

        // const onNormalModuleFactoryParser = (
        //   parser: Webpack.javascript.JavascriptParser,
        // ) => {
        //   parser.hooks.program.tap(RspackRscClientPlugin.name, () => {
        //     const entryModules = getEntryModule(compilation);

        //     for (const entryModule of entryModules) {
        //       if (entryModule === parser.state.module) {
        //         addClientReferencesChunks(compilation, entryModule, () => {});
        //       }
        //     }
        //   });
        // };

        // normalModuleFactory.hooks.parser
        //   .for(`javascript/auto`)
        //   .tap(`HarmonyModulesPlugin`, onNormalModuleFactoryParser);

        // normalModuleFactory.hooks.parser
        //   .for(`javascript/dynamic`)
        //   .tap(`HarmonyModulesPlugin`, onNormalModuleFactoryParser);

        // normalModuleFactory.hooks.parser
        //   .for(`javascript/esm`)
        //   .tap(`HarmonyModulesPlugin`, onNormalModuleFactoryParser);

        compilation.hooks.additionalTreeRuntimeRequirements.tap(
          RspackRscClientPlugin.name,
          (_chunk, runtimeRequirements) => {
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

            if (resourcePath?.includes('Counter')) {
              console.log(
                'clientReferences2222222222',
                this.clientReferencesMap,
                resourcePath,
                clientReferences,
              );
            }

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

                console.log(
                  'ccccccccccc',
                  chunkGraph.getModuleChunksIterable(module),
                );

                for (const connection of moduleGraph.getOutgoingConnections(
                  module,
                )) {
                  for (const chunk of chunkGraph.getModuleChunksIterable(
                    connection.module,
                  )) {
                    console.log('aaaaaaaaaaaa');
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
