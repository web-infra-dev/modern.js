import type { ServerManifest } from 'react-server-dom-webpack';
import type Webpack from 'webpack';
import type {
  ClientReferencesMap,
  ServerReferencesMap,
} from './webpack-rsc-server-loader.cjs';

export interface WebpackRscServerPluginOptions {
  readonly clientReferencesMap: ClientReferencesMap;
  readonly serverReferencesMap: ServerReferencesMap;
  readonly serverManifestFilename?: string;
  readonly styles?: Set<string>;
}

export interface ModuleExportsInfo {
  readonly moduleResource: string;
  readonly exportName: string;
}

export const webpackRscLayerName = `rsc`;
export class WebpackRscServerPlugin {
  private clientReferencesMap: ClientReferencesMap;
  private serverReferencesMap: ServerReferencesMap;
  private serverManifest: ServerManifest = {};
  private serverManifestFilename: string;
  private styles: Set<string>;
  constructor(options: WebpackRscServerPluginOptions) {
    this.clientReferencesMap = options.clientReferencesMap;
    this.serverReferencesMap = options.serverReferencesMap;
    this.styles = options.styles || [];

    this.serverManifestFilename =
      options?.serverManifestFilename || `react-server-manifest.json`;
  }

  apply(compiler: Webpack.Compiler): void {
    const {
      EntryPlugin,
      WebpackError,
      dependencies: { NullDependency },
      util: {
        runtime: { getEntryRuntime },
      },
      sources: { RawSource },
      RuntimeGlobals,
    } = compiler.webpack;

    class ServerReferenceDependency extends NullDependency {
      override get type(): string {
        return `server-reference`;
      }
    }

    ServerReferenceDependency.Template = class ServerReferenceDependencyTemplate extends (
      NullDependency.Template
    ) {
      override apply(
        _dependency: ServerReferenceDependency,
        _source: Webpack.sources.ReplaceSource,
        { runtimeRequirements }: { runtimeRequirements: Set<string> },
      ) {
        runtimeRequirements.add(RuntimeGlobals.moduleId);
      }
    };

    function hasServerReferenceDependency(module: Webpack.Module): boolean {
      return module.dependencies.some(
        dependency => dependency instanceof ServerReferenceDependency,
      );
    }

    const includeModule = async (
      compilation: Webpack.Compilation,
      resource: string,
      layer?: string,
    ) => {
      const [entry, ...otherEntries] = compilation.entries.entries();

      if (!entry) {
        compilation.errors.push(
          new WebpackError(`Could not find an entry in the compilation.`),
        );

        return;
      }

      if (otherEntries.length > 0) {
        compilation.warnings.push(
          new WebpackError(
            `Found multiple entries in the compilation, adding module include for ${resource} only to the first entry.`,
          ),
        );
      }

      const [entryName] = entry;

      const dependency = EntryPlugin.createDependency(resource, {
        name: resource,
      });

      return new Promise<void>((resolve, reject) => {
        compilation.addInclude(
          compiler.context,
          dependency,
          { name: entryName, layer },
          (error, module) => {
            if (error) {
              compilation.errors.push(error);

              return reject(error);
            }

            if (!module) {
              const noModuleError = new WebpackError(`Module not added`);
              noModuleError.file = resource;
              compilation.errors.push(noModuleError);

              return reject(noModuleError);
            }

            const runtime = getEntryRuntime(compilation, entryName, {
              name: entryName,
            });

            compilation.moduleGraph
              .getExportsInfo(module)
              .setUsedInUnknownWay(runtime);

            resolve();
          },
        );
      });
    };

    let needsAdditionalPass = false;

    compiler.hooks.finishMake.tapPromise(
      WebpackRscServerPlugin.name,
      async compilation => {
        this.serverManifest = {};
        const clientReferences = [...this.clientReferencesMap.keys()];
        const serverReferences = [...this.serverReferencesMap.keys()];
        const referencesBefore = [...clientReferences, ...serverReferences];
        await Promise.all([
          ...clientReferences.map(async resource => {
            try {
              await includeModule(compilation, resource);
            } catch (error) {
              console.error('error', error);
              this.clientReferencesMap.delete(resource);
            }
          }),
          ...serverReferences.map(async resource => {
            try {
              await includeModule(compilation, resource, webpackRscLayerName);
            } catch (error) {
              console.error('error', error);
              this.serverReferencesMap.delete(resource);
            }
          }),
        ]);

        const referencesAfter = [
          ...this.clientReferencesMap.keys(),
          ...this.serverReferencesMap.keys(),
        ];

        if (
          referencesBefore.length !== referencesAfter.length ||
          !referencesAfter.every(reference =>
            referencesBefore.includes(reference),
          )
        ) {
          needsAdditionalPass = true;
        }

        for (const module of compilation.modules) {
          // TODO:临时代码:写死 layer name
          if (
            module.resource?.endsWith('.css') &&
            module.layer === 'react-server'
          ) {
            this.styles.add(module.resource);
          }
        }
      },
    );

    compiler.hooks.thisCompilation.tap(
      WebpackRscServerPlugin.name,
      (compilation, { normalModuleFactory }) => {
        compilation.dependencyFactories.set(
          ServerReferenceDependency,
          normalModuleFactory,
        );

        compilation.dependencyTemplates.set(
          ServerReferenceDependency,
          new ServerReferenceDependency.Template(),
        );

        const onNormalModuleFactoryParser = (
          parser: Webpack.javascript.JavascriptParser,
        ) => {
          parser.hooks.program.tap(WebpackRscServerPlugin.name, () => {
            const { module } = parser.state;
            const { resource } = module;
            const isClientModule = this.clientReferencesMap.has(resource);
            const isServerModule = this.serverReferencesMap.has(resource);

            if (isServerModule && isClientModule) {
              compilation.errors.push(
                new WebpackError(
                  `Cannot use both 'use server' and 'use client' in the same module ${resource}.`,
                ),
              );

              return;
            }

            if (
              module.layer === webpackRscLayerName &&
              isServerModule &&
              !hasServerReferenceDependency(module)
            ) {
              module.addDependency(new ServerReferenceDependency());
            }
          });

          parser.hooks.expression
            .for(RuntimeGlobals.moduleId)
            .tap(WebpackRscServerPlugin.name, () => {
              parser.state.module.buildInfo.moduleArgument =
                RuntimeGlobals.module;

              return true;
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

        compilation.hooks.needAdditionalPass.tap(
          WebpackRscServerPlugin.name,
          () => !(needsAdditionalPass = !needsAdditionalPass),
        );

        compilation.hooks.afterOptimizeModuleIds.tap(
          WebpackRscServerPlugin.name,
          modules => {
            for (const module of modules) {
              const resource = module.nameForCondition();

              if (!resource) {
                continue;
              }

              const moduleId = compilation.chunkGraph.getModuleId(module);

              if (moduleId === null) {
                continue;
              }

              if (
                module.layer !== webpackRscLayerName &&
                this.clientReferencesMap.has(resource)
              ) {
                const clientReferences = this.clientReferencesMap.get(resource);

                if (clientReferences) {
                  for (const clientReference of clientReferences) {
                    clientReference.ssrId = moduleId;
                  }
                } else {
                  compilation.errors.push(
                    new WebpackError(
                      `Could not find client references info in \`clientReferencesMap\` for ${resource}.`,
                    ),
                  );
                }
              } else if (hasServerReferenceDependency(module)) {
                const serverReferencesModuleInfo =
                  this.serverReferencesMap.get(resource);

                if (serverReferencesModuleInfo) {
                  serverReferencesModuleInfo.moduleId = moduleId;

                  for (const exportName of serverReferencesModuleInfo.exportNames) {
                    this.serverManifest[`${moduleId}#${exportName}`] = {
                      id: moduleId,
                      chunks: [],
                      name: exportName,
                    };
                  }
                } else {
                  compilation.errors.push(
                    new WebpackError(
                      `Could not find server references module info in \`serverReferencesMap\` for ${resource}.`,
                    ),
                  );
                }
              }
            }
          },
        );

        compilation.hooks.processAssets.tap(WebpackRscServerPlugin.name, () => {
          compilation.emitAsset(
            this.serverManifestFilename,
            new RawSource(JSON.stringify(this.serverManifest, null, 2), false),
          );
        });
      },
    );
  }
}
