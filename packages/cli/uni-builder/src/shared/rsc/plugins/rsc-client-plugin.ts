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

    const getEntryModule = (
      compilation: Webpack.Compilation,
      type: 'finishMake' | 'jsParse',
    ): Module[] => {
      const entryModules: Webpack.Module[] = [];

      for (const [, entryValue] of compilation.entries.entries()) {
        const entryDependency = entryValue.dependencies.find(
          dependency => dependency.constructor.name === `EntryDependency`,
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
        if (type === 'finishMake') {
          compilation.errors.push(
            new WebpackError(`Could not find any entries in the compilation.`),
          );
        }

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
        const entryModules = getEntryModule(compilation, 'finishMake');

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
        compilation.dependencyFactories.set(
          ClientReferenceDependency,
          normalModuleFactory,
        );

        compilation.dependencyTemplates.set(
          ClientReferenceDependency,
          new NullDependency.Template(),
        );
      },
    );

    compiler.hooks.thisCompilation.tap(
      RscClientPlugin.name,
      (compilation, { normalModuleFactory }) => {
        this.styles = sharedData.get('styles') as Set<string>;
        this.clientReferencesMap = sharedData.get(
          'clientReferencesMap',
        ) as ClientReferencesMap;

        const onNormalModuleFactoryParser = (
          parser: Webpack.javascript.JavascriptParser,
        ) => {
          parser.hooks.program.tap(RscClientPlugin.name, () => {
            const entryModules = getEntryModule(compilation, 'jsParse');

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
            runtimeRequirements.add(
              compiler.webpack.RuntimeGlobals.ensureChunk,
            );
            runtimeRequirements.add(
              compiler.webpack.RuntimeGlobals.compatGetDefaultExport,
            );
          },
        );

        compilation.hooks.processAssets.tap(RscClientPlugin.name, () => {
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
