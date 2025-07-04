import type Webpack from 'webpack';
import { type Compilation, type ModuleGraph, NormalModule } from 'webpack';
import {
  type ServerManifest,
  type ServerReferencesMap,
  findRootIssuer,
  getRscBuildInfo,
  isCssModule,
  setRscBuildInfo,
  sharedData,
  webpackRscLayerName,
} from '../common';
import type { ClientReferencesMap } from '../common';
import type { EntryInfo } from './rspack-rsc-server-plugin';

export interface RscServerPluginOptions {
  readonly serverManifestFilename?: string;
  readonly entryPath2Name: Map<string, string>;
}

export interface ModuleExportsInfo {
  readonly moduleResource: string;
  readonly exportName: string;
}

const resourcePath2Entries = new Map<
  string,
  {
    entryName: string;
    entryPath: string;
  }[]
>();

export class RscServerPlugin {
  private clientReferencesMap: ClientReferencesMap = new Map();
  private serverReferencesMap: ServerReferencesMap = new Map();
  private serverManifest: ServerManifest = {};
  private serverManifestFilename: string;
  private entryPath2Name = new Map<string, string>();
  private styles: Set<string>;
  private moduleToEntries = new Map<string, Set<string>>();
  constructor(options: RscServerPluginOptions) {
    this.styles = new Set();

    this.serverManifestFilename =
      options?.serverManifestFilename || `react-server-manifest.json`;

    this.entryPath2Name = options?.entryPath2Name || new Map();
  }

  private isValidModule(module: NormalModule): boolean {
    return Boolean(module?.resource);
  }

  private hasValidEntries(
    entries: EntryInfo[] | undefined,
  ): entries is EntryInfo[] {
    return Boolean(entries && entries.length > 0);
  }

  private traverseModulesFromEntry(
    module: NormalModule,
    entryName: string,
    moduleGraph: ModuleGraph,
    visited: Set<string>,
  ): void {
    if (!module?.resource || visited.has(module.resource)) {
      return;
    }
    visited.add(module.resource);

    if (!this.moduleToEntries.has(module.resource)) {
      this.moduleToEntries.set(module.resource, new Set());
    }
    this.moduleToEntries.get(module.resource)!.add(entryName);

    for (const connection of moduleGraph.getOutgoingConnections(module)) {
      if (connection.module && 'resource' in connection.module) {
        this.traverseModulesFromEntry(
          connection.module as NormalModule,
          entryName,
          moduleGraph,
          visited,
        );
      }
    }
  }

  private findModuleEntries(
    module: NormalModule,
    compilation: Compilation,
    resourcePath2Entries: Map<string, EntryInfo[]>,
    visited = new Set<string>(),
  ): EntryInfo[] {
    if (!this.isValidModule(module) || visited.has(module.resource)) {
      return [];
    }
    visited.add(module.resource);

    const currentEntries = resourcePath2Entries.get(module.resource);
    if (this.hasValidEntries(currentEntries)) {
      return currentEntries;
    }

    const entryNames = this.moduleToEntries.get(module.resource);
    if (entryNames && entryNames.size > 0) {
      const entries: EntryInfo[] = [];
      for (const entryName of entryNames) {
        const entryPath = this.getEntryPathByName(entryName, compilation);
        if (entryPath) {
          entries.push({ entryName, entryPath });
        }
      }

      return entries;
    }

    const issuer = findRootIssuer(compilation.moduleGraph, module);
    if (!issuer) {
      return [];
    }

    // Recursively find entries for the issuer
    const issuerEntries = this.findModuleEntries(
      issuer,
      compilation,
      resourcePath2Entries,
      visited,
    );

    if (issuerEntries.length > 0) {
      return issuerEntries;
    }

    const entryName = this.getEntryNameFromIssuer(issuer);
    if (entryName) {
      return [this.createEntryFromIssuer(issuer, entryName)];
    }

    return [];
  }

  private getEntryNameFromIssuer(issuer: NormalModule): string | undefined {
    return issuer.resource
      ? this.entryPath2Name.get(issuer.resource)
      : undefined;
  }

  private createEntryFromIssuer(
    issuer: NormalModule,
    entryName: string,
  ): EntryInfo {
    return { entryName, entryPath: issuer.resource };
  }

  private buildModuleToEntriesMapping(compilation: Compilation): void {
    this.moduleToEntries.clear();

    for (const [entryName, entryDependency] of compilation.entries.entries()) {
      const entryModule = compilation.moduleGraph.getModule(
        entryDependency.dependencies[0],
      );
      if (!entryModule) continue;

      this.traverseModulesFromEntry(
        entryModule as NormalModule,
        entryName,
        compilation.moduleGraph,
        new Set(),
      );
    }
  }

  private getEntryPathByName(
    entryName: string,
    compilation: Compilation,
  ): string | undefined {
    const entryDependency = compilation.entries.get(entryName);
    if (entryDependency && entryDependency.dependencies.length > 0) {
      const firstDep = entryDependency.dependencies[0];
      if ('request' in firstDep && typeof firstDep.request === 'string') {
        return firstDep.request;
      }
    }
    return undefined;
  }

  apply(compiler: Webpack.Compiler): void {
    const {
      EntryPlugin,
      WebpackError,
      dependencies: { NullDependency },
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
      resourceEntryNames?: string[],
      layer?: string,
    ) => {
      const entries = Array.from(compilation.entries.entries());

      if (entries.length === 0) {
        compilation.errors.push(
          new WebpackError(`Could not find an entry in the compilation.`),
        );

        return;
      }

      const includePromises = entries
        .filter(([entryName]) => resourceEntryNames?.includes(entryName))
        .map(([entryName]) => {
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

                setRscBuildInfo(module, {
                  __entryName: entryName,
                });

                compilation.moduleGraph
                  .getExportsInfo(module)
                  .setUsedInUnknownWay(entryName);

                resolve();
              },
            );
          });
        });

      await Promise.all(includePromises);
    };

    let needsAdditionalPass = false;

    compiler.hooks.finishMake.tapPromise(
      RscServerPlugin.name,
      async compilation => {
        this.buildModuleToEntriesMapping(compilation);

        const processModules = (modules: Webpack.Compilation['modules']) => {
          let hasChangeReference = false;

          for (const module of modules) {
            if ('resource' in module && isCssModule(module)) {
              this.styles.add(module.resource as string);
            }

            const buildInfo = getRscBuildInfo(module);
            if (!buildInfo || !buildInfo.resourcePath) {
              continue;
            }

            if (module.layer && buildInfo.type === 'server') {
              sharedData.set(buildInfo?.resourcePath, buildInfo);
            }

            if (!module.layer && buildInfo.type === 'client') {
              sharedData.set(buildInfo?.resourcePath, buildInfo);
            }

            const currentReference =
              buildInfo?.type === 'client'
                ? this.clientReferencesMap.get(buildInfo.resourcePath)
                : this.serverReferencesMap.get(buildInfo.resourcePath);

            if (buildInfo?.type === 'client' && !currentReference) {
              hasChangeReference = true;
              this.clientReferencesMap.set(
                buildInfo.resourcePath,
                buildInfo.clientReferences,
              );
            } else if (buildInfo?.type === 'server' && !currentReference) {
              hasChangeReference = true;

              this.serverReferencesMap.set(
                buildInfo.resourcePath,
                buildInfo.exportNames,
              );
            }

            if (module instanceof NormalModule) {
              // server component -> client -component(react-server layer) -> client component(default layer) -> server action(default layer) -> server action(react-server layer)
              const entries = this.findModuleEntries(
                module,
                compilation,
                resourcePath2Entries,
              );
              if (entries.length > 0) {
                resourcePath2Entries.set(module.resource, entries);
              }
            }
          }

          return hasChangeReference;
        };

        this.serverManifest = {};

        const clientReferences = [...this.clientReferencesMap.keys()];
        const serverReferences = [...this.serverReferencesMap.keys()];
        const referencesBefore = [...clientReferences, ...serverReferences];

        let hasChangeReference = false;
        await Promise.all([
          ...clientReferences.map(async resource => {
            try {
              await includeModule(
                compilation,
                resource,
                resourcePath2Entries
                  .get(resource)
                  ?.map(entry => entry.entryName) || [],
              );
            } catch (error) {
              console.error(error);
              hasChangeReference = true;
              this.clientReferencesMap.delete(resource);
            }
          }),
          ...serverReferences.map(async resource => {
            try {
              await includeModule(
                compilation,
                resource,
                resourcePath2Entries
                  .get(resource)
                  ?.map(entry => entry.entryName) || [],
                webpackRscLayerName,
              );
            } catch (error) {
              console.error(error);
              hasChangeReference = true;
              this.serverReferencesMap.delete(resource);
            }
          }),
        ]);

        hasChangeReference = processModules(compilation.modules);

        const referencesAfter = [
          ...this.clientReferencesMap.keys(),
          ...this.serverReferencesMap.keys(),
        ];

        if (
          referencesBefore.length !== referencesAfter.length ||
          (!referencesAfter.every(reference =>
            referencesBefore.includes(reference),
          ) &&
            hasChangeReference)
        ) {
          needsAdditionalPass = true;
        }
      },
    );

    compiler.hooks.done.tap(RscServerPlugin.name, () => {
      sharedData.set('serverReferencesMap', this.serverReferencesMap);
      sharedData.set('clientReferencesMap', this.clientReferencesMap);
      sharedData.set('styles', this.styles);
    });

    compiler.hooks.thisCompilation.tap(
      RscServerPlugin.name,
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
          parser.hooks.program.tap(RscServerPlugin.name, () => {
            const { module } = parser.state;
            const { resource } = module;
            const buildInfo = getRscBuildInfo(module);
            const isClientModule = buildInfo?.type === 'client';
            const isServerModule = buildInfo?.type === 'server';

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
            .tap(RscServerPlugin.name, () => {
              parser.state.module.buildInfo!.moduleArgument =
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
          RscServerPlugin.name,
          () => !(needsAdditionalPass = !needsAdditionalPass),
        );

        compilation.hooks.afterOptimizeModuleIds.tap(
          RscServerPlugin.name,
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
                const serverReferencesModuleInfo = getRscBuildInfo(module);
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

        compilation.hooks.processAssets.tap(RscServerPlugin.name, () => {
          compilation.emitAsset(
            this.serverManifestFilename,
            new RawSource(JSON.stringify(this.serverManifest, null, 2), false),
          );
        });
      },
    );
  }
}
