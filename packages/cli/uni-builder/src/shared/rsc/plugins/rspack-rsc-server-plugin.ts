import { promises as fs } from 'fs';
import path from 'path';
import type Webpack from 'webpack';
import type { Compilation, ModuleGraph, NormalModule } from 'webpack';
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

export interface RscServerPluginOptions {
  readonly serverManifestFilename?: string;
  readonly entryPath2Name: Map<string, string>;
}

export interface ModuleExportsInfo {
  readonly moduleResource: string;
  readonly exportName: string;
}

export interface EntryInfo {
  readonly entryName: string;
  readonly entryPath: string;
}

const resourcePath2Entries = new Map<string, EntryInfo[]>();
export class RscServerPlugin {
  private clientReferencesMap: ClientReferencesMap = new Map();
  private serverReferencesMap: ServerReferencesMap = new Map();
  private serverManifest: ServerManifest = {};
  private serverManifestFilename: string;
  private entryPath2Name = new Map<string, string>();
  private styles: Set<string>;
  private moduleToEntries = new Map<string, Set<string>>();
  private serverModuleInfo = new Map<string, ServerReferencesModuleInfo>();
  private serverReferencesManifestFilename = 'server-references-manifest.json';
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

  private getEntryPathByName(
    entryName: string,
    compilation: Compilation,
  ): string | undefined {
    const entryDependency = compilation.entries.get(entryName);
    if (entryDependency && entryDependency.dependencies.length > 0) {
      // The first dependency is the entry point of the entry
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
      sources: { RawSource },
    } = compiler.webpack;

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

      const targetEntries =
        resourceEntryNames && resourceEntryNames.length > 0
          ? entries.filter(([entryName]) =>
              resourceEntryNames.includes(entryName),
            )
          : entries;

      const includePromises = targetEntries.map(([entryName]) => {
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
        // Briefly wait for the client compiler to advertise any server action
        // candidates it discovered so we can include them in this pass.
        try {
          const deadline =
            Date.now() + Number(process.env.RSPACK_RSC_WAIT_MS || 3000);
          while (Date.now() < deadline) {
            const candidates = sharedData.get<
              Map<string, ServerReferencesModuleInfo>
            >('serverModuleInfoCandidates');
            if (candidates && candidates.size > 0) {
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch {}

        // Merge server action candidates discovered by the client compiler so the
        // server build includes them and assigns stable moduleIds.
        try {
          const candidates = sharedData.get<
            Map<string, ServerReferencesModuleInfo>
          >('serverModuleInfoCandidates');
          if (candidates && candidates.size > 0) {
            for (const [resourcePath, info] of candidates.entries()) {
              if (info.exportNames?.length) {
                if (!this.serverReferencesMap.has(resourcePath)) {
                  this.serverReferencesMap.set(resourcePath, info);
                }
                const existing = this.serverModuleInfo.get(resourcePath);
                this.serverModuleInfo.set(resourcePath, {
                  moduleId: existing?.moduleId ?? info.moduleId,
                  exportNames: info.exportNames,
                });
                sharedData.set(resourcePath, {
                  type: 'server',
                  exportNames: info.exportNames,
                  moduleId: info.moduleId,
                  resourcePath,
                } as any);
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

            if (module.layer && buildInfo.type === 'server') {
              sharedData.set(buildInfo?.resourcePath, buildInfo);
              const existing = this.serverModuleInfo.get(
                buildInfo.resourcePath,
              );
              this.serverModuleInfo.set(buildInfo.resourcePath, {
                exportNames:
                  buildInfo.exportNames || existing?.exportNames || [],
                moduleId: existing?.moduleId,
              });
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
                buildInfo as any,
              );
            }

            // server component -> client -component(react-server layer) -> client component(default layer) -> server action(default layer) -> server action(react-server layer)
            const entries = this.findModuleEntries(
              module as NormalModule,
              compilation,
              resourcePath2Entries,
            );
            if (entries.length > 0) {
              resourcePath2Entries.set(
                (module as NormalModule).resource,
                entries,
              );
            }
          }

          return hasChangeReference;
        };

        this.serverManifest = {};
        if (process.env.DEBUG_RSC_PLUGIN) {
          console.log('[RspackRscServerPlugin] refs before include:', {
            client: this.clientReferencesMap.size,
            server: this.serverReferencesMap.size,
            serverInfo: this.serverModuleInfo.size,
          });
        }

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
        // its initial build. Without this, the Rspack client plugin's
        // finishMake hook may run before these maps are available, yielding an
        // empty react-client-manifest.json in single-pass builds.
        try {
          sharedData.set('clientReferencesMap', this.clientReferencesMap);
          sharedData.set('serverReferencesMap', this.serverReferencesMap);
          sharedData.set('styles', this.styles);
          sharedData.set('serverModuleInfoMap', this.serverModuleInfo);
          if (process.env.DEBUG_RSC_PLUGIN) {
            console.log('[RspackRscServerPlugin] published maps:', {
              client: this.clientReferencesMap.size,
              server: this.serverReferencesMap.size,
              serverInfo: this.serverModuleInfo.size,
            });
            if (this.clientReferencesMap.size > 0) {
              console.log(
                '[RspackRscServerPlugin] clientReferencesMap keys:',
                Array.from(this.clientReferencesMap.keys()),
              );
            }
          }
        } catch {}
      },
    );

    compiler.hooks.done.tap(RscServerPlugin.name, () => {
      sharedData.set('serverReferencesMap', this.serverReferencesMap);
      sharedData.set('clientReferencesMap', this.clientReferencesMap);
      sharedData.set('styles', this.styles);
      sharedData.set('serverModuleInfoMap', this.serverModuleInfo);
    });

    compiler.hooks.afterCompile.tap(RscServerPlugin.name, compilation => {
      for (const module of compilation.modules) {
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
        } else if (
          module.layer === webpackRscLayerName &&
          getRscBuildInfo(module)?.type === 'server'
        ) {
          const serverReferencesModuleInfo = getRscBuildInfo(module);
          if (serverReferencesModuleInfo) {
            serverReferencesModuleInfo.moduleId = moduleId;
            const existing = this.serverModuleInfo.get(resource) || {
              exportNames: serverReferencesModuleInfo.exportNames || [],
            };
            this.serverModuleInfo.set(resource, {
              exportNames:
                existing.exportNames ||
                serverReferencesModuleInfo.exportNames ||
                [],
              moduleId,
            });

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
    });

    compiler.hooks.thisCompilation.tap(
      RscServerPlugin.name,
      (compilation, { normalModuleFactory }) => {
        compilation.hooks.needAdditionalPass.tap(
          RscServerPlugin.name,
          () => !(needsAdditionalPass = !needsAdditionalPass),
        );

        compilation.hooks.processAssets.tap(RscServerPlugin.name, () => {
          compilation.emitAsset(
            this.serverManifestFilename,
            new RawSource(JSON.stringify(this.serverManifest, null, 2), false),
          );
        });
      },
    );

    // Persist a manifest mapping server modules to their export names and ids
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

        const filename = path.join(
          outputPath,
          this.serverReferencesManifestFilename,
        );

        try {
          await fs.mkdir(path.dirname(filename), { recursive: true });
          await fs.writeFile(
            filename,
            JSON.stringify(manifest, null, 2),
            'utf-8',
          );
          sharedData.set('serverReferencesManifestPath', filename);
          if (process.env.DEBUG_RSC_PLUGIN) {
            console.log(
              '[RspackRscServerPlugin] wrote server-references-manifest with entries:',
              manifest.serverReferences.length,
            );
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[RscServerPlugin] failed to write server manifest', e);
        }
      },
    );
  }
}
