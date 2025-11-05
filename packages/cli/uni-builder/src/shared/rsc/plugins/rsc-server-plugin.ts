import { promises as fs, existsSync } from 'fs';
import path from 'path';
import type Webpack from 'webpack';
import { type Compilation, type ModuleGraph, NormalModule } from 'webpack';
import {
  type ServerManifest,
  type ServerReferencesMap,
  type ServerReferencesModuleInfo,
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
  private serverReferencesManifestFilename: string;
  private serverReferencesManifestPath?: string;
  private serverModuleInfo = new Map<string, ServerReferencesModuleInfo>();
  constructor(options: RscServerPluginOptions) {
    this.styles = new Set();

    this.serverManifestFilename =
      options?.serverManifestFilename || `react-server-manifest.json`;

    this.entryPath2Name = options?.entryPath2Name || new Map();
    this.serverReferencesManifestFilename = 'server-references-manifest.json';
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

    if (process.env.DEBUG_RSC_PLUGIN) {
      compilation.modules.forEach(module => {
        if (
          module?.constructor &&
          (module.constructor.name === 'ContainerEntryModule' ||
            (module as any).type === 'container entry')
        ) {
          console.log(
            `[RscServerPlugin] found container entry module name=${
              (module as any).name || ''
            }`,
          );

          const connections =
            compilation.moduleGraph.getOutgoingConnections(module);
          for (const connection of connections) {
            if (connection?.module) {
              console.log(
                `[RscServerPlugin]  connection to ${
                  'resource' in connection.module && connection.module.resource
                    ? connection.module.resource
                    : connection.module.identifier?.()
                }`,
              );
            }
          }
        }
      });
    }

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
        .filter(([entryName]) =>
          resourceEntryNames && resourceEntryNames.length > 0
            ? resourceEntryNames.includes(entryName)
            : true,
        )
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
        this.serverModuleInfo.clear();

        // Merge server action candidates discovered by the client compiler so the
        // server build includes them and assigns stable moduleIds.
        try {
          const candidates = sharedData.get<
            Map<string, ServerReferencesModuleInfo>
          >('serverModuleInfoCandidates');
          if (process.env.DEBUG_RSC_PLUGIN) {
            console.log('[RscServerPlugin] candidates:', candidates?.size || 0);
          }
          if (candidates && candidates.size > 0) {
            for (const [resourcePath, info] of candidates.entries()) {
              if (info.exportNames?.length) {
                if (!this.serverReferencesMap.has(resourcePath)) {
                  this.serverReferencesMap.set(resourcePath, info);
                }
                if (!this.serverModuleInfo.has(resourcePath)) {
                  this.serverModuleInfo.set(resourcePath, {
                    moduleId: info.moduleId,
                    exportNames: info.exportNames,
                  });
                }
                sharedData.set(resourcePath, {
                  type: 'server',
                  exportNames: info.exportNames,
                  moduleId: info.moduleId,
                });
              }
            }
          }
        } catch {}

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

            if (buildInfo.type === 'server') {
              sharedData.set(buildInfo?.resourcePath, buildInfo);
            } else if (!module.layer && buildInfo.type === 'client') {
              sharedData.set(buildInfo?.resourcePath, buildInfo);
            }

            const currentReference =
              buildInfo?.type === 'client'
                ? this.clientReferencesMap.get(buildInfo.resourcePath)
                : this.serverReferencesMap.get(buildInfo.resourcePath);

            if (buildInfo?.type === 'server') {
              this.serverModuleInfo.set(
                buildInfo.resourcePath,
                buildInfo as ServerReferencesModuleInfo,
              );
            }

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
                buildInfo as ServerReferencesModuleInfo,
              );
              if (process.env.DEBUG_RSC_PLUGIN) {
                console.log(
                  `[RscServerPlugin] server module detected ${buildInfo.resourcePath}`,
                );
              }
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

        // Publish interim maps early so the client compiler can read them in
        // its initial build, avoiding an empty client manifest due to timing.
        try {
          sharedData.set('clientReferencesMap', this.clientReferencesMap);
          sharedData.set('styles', this.styles);
          sharedData.set('serverModuleInfoMap', this.serverModuleInfo);
        } catch {}
      },
    );

    compiler.hooks.done.tapPromise(RscServerPlugin.name, async stats => {
      if (process.env.DEBUG_RSC_PLUGIN) {
        try {
          const info = stats?.toJson?.({ all: false, errors: true });
          const firstError = info?.errors?.[0];
          if (firstError) {
            // eslint-disable-next-line no-console
            console.error(
              '[RscServerPlugin] first compilation error:',
              firstError.message || firstError,
            );
          }
        } catch {}
      }

      // Ensure all server module entries have moduleId populated before sharing
      const compilation = stats?.compilation;
      if (compilation) {
        for (const [
          resourcePath,
          moduleInfo,
        ] of this.serverModuleInfo.entries()) {
          if (
            moduleInfo.moduleId === undefined &&
            moduleInfo.exportNames?.length
          ) {
            // Try to find the module and get its ID from chunkGraph
            for (const module of compilation.modules) {
              if (module.nameForCondition?.() === resourcePath) {
                const moduleId = compilation.chunkGraph.getModuleId(module);
                if (moduleId !== null) {
                  moduleInfo.moduleId = moduleId;
                  if (process.env.DEBUG_RSC_PLUGIN) {
                    console.log(
                      `[RscServerPlugin] hydrated moduleId ${moduleId} for ${resourcePath} in done hook from chunkGraph`,
                    );
                  }
                  break;
                }
              }
            }
          }
        }
      }

      // If the manifest was written during afterEmit, read it back to ensure moduleIds are synchronized
      if (
        this.serverReferencesManifestPath &&
        existsSync(this.serverReferencesManifestPath)
      ) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay to ensure file write completed
          const manifestContent = await fs.readFile(
            this.serverReferencesManifestPath,
            'utf-8',
          );
          const manifest = JSON.parse(manifestContent) as {
            serverReferences: Array<{
              path: string;
              exports: string[];
              moduleId: string | number | null;
            }>;
          };

          for (const entry of manifest.serverReferences) {
            if (entry.moduleId != null) {
              const moduleInfo = this.serverModuleInfo.get(entry.path);
              if (moduleInfo && moduleInfo.moduleId === undefined) {
                moduleInfo.moduleId = entry.moduleId as any;
                if (process.env.DEBUG_RSC_PLUGIN) {
                  console.log(
                    `[RscServerPlugin] hydrated moduleId ${entry.moduleId} for ${entry.path} in done hook from manifest file`,
                  );
                }
              }
            }
          }
        } catch (err) {
          if (process.env.DEBUG_RSC_PLUGIN) {
            console.warn(
              '[RscServerPlugin] failed to read manifest in done hook:',
              err,
            );
          }
        }
      }

      // Re-write the manifest file with hydrated moduleIds
      if (this.serverReferencesManifestPath) {
        const manifest = {
          serverReferences: Array.from(this.serverModuleInfo.entries()).map(
            ([resourcePath, info]) => ({
              path: resourcePath,
              exports: info.exportNames ?? [],
              moduleId: info.moduleId ?? null,
            }),
          ),
        };

        try {
          await fs.writeFile(
            this.serverReferencesManifestPath,
            JSON.stringify(manifest, null, 2),
            'utf-8',
          );
          if (process.env.DEBUG_RSC_PLUGIN) {
            console.log(
              `[RscServerPlugin] re-wrote manifest in done hook with hydrated moduleIds`,
            );
          }
        } catch (err) {
          if (process.env.DEBUG_RSC_PLUGIN) {
            console.warn(
              '[RscServerPlugin] failed to re-write manifest in done hook:',
              err,
            );
          }
        }
      }

      sharedData.set('serverReferencesMap', this.serverReferencesMap);
      sharedData.set('clientReferencesMap', this.clientReferencesMap);
      sharedData.set('styles', this.styles);
      sharedData.set('serverModuleInfoMap', this.serverModuleInfo);
      if (this.serverReferencesManifestPath) {
        sharedData.set(
          'serverReferencesManifestPath',
          this.serverReferencesManifestPath,
        );
      }
    });

    compiler.hooks.afterEmit.tapPromise(
      RscServerPlugin.name,
      async compilation => {
        const outputPath =
          compilation.outputOptions.path || compiler.options.output.path;
        if (!outputPath) {
          return;
        }

        const manifest = {
          serverReferences: Array.from(this.serverModuleInfo.entries()).map(
            ([resourcePath, info]) => ({
              path: resourcePath,
              exports: info.exportNames ?? [],
              moduleId: info.moduleId ?? null,
            }),
          ),
        };

        if (process.env.DEBUG_RSC_PLUGIN) {
          console.log(
            `[RscServerPlugin] writing server references manifest at ${outputPath} with ${manifest.serverReferences.length} entries`,
          );
        }

        const manifestPath = path.join(
          outputPath,
          this.serverReferencesManifestFilename,
        );

        await fs.mkdir(path.dirname(manifestPath), { recursive: true });
        await fs.writeFile(
          manifestPath,
          JSON.stringify(manifest, null, 2),
          'utf-8',
        );

        this.serverReferencesManifestPath = manifestPath;
        sharedData.set('serverReferencesManifestPath', manifestPath);
      },
    );

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

            // Add ServerReferenceDependency to all server action modules (with 'use server'),
            // not just those in react-server layer. This allows server actions to be
            // imported from client components.
            if (isServerModule && !hasServerReferenceDependency(module)) {
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
                if (serverReferencesModuleInfo?.exportNames?.length) {
                  serverReferencesModuleInfo.moduleId = moduleId;
                  if (process.env.DEBUG_RSC_PLUGIN) {
                    // eslint-disable-next-line no-console
                    console.log(
                      '[RscServerPlugin] assigned moduleId',
                      moduleId,
                      'for',
                      resource,
                    );
                  }

                  for (const exportName of serverReferencesModuleInfo.exportNames) {
                    this.serverManifest[`${moduleId}#${exportName}`] = {
                      id: moduleId,
                      chunks: [],
                      name: exportName,
                    };
                  }
                } else {
                  // Tolerate spurious ServerReferenceDependency on non-action modules
                  // such as framework server entries; skip instead of erroring to
                  // keep the server build progressing.
                  if (process.env.DEBUG_RSC_PLUGIN) {
                    // eslint-disable-next-line no-console
                    console.warn(
                      `[RscServerPlugin] skip non-action server reference module: ${resource}`,
                    );
                  }
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
