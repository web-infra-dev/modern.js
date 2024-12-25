import type Webpack from 'webpack';
import {
  type ServerManifest,
  type ServerReferencesMap,
  getRscBuildInfo,
  isCssModule,
  sharedData,
} from '../common';
import type { ClientReferencesMap } from '../common';

export interface RscServerPluginOptions {
  readonly serverManifestFilename?: string;
}

export interface ModuleExportsInfo {
  readonly moduleResource: string;
  readonly exportName: string;
}

export const webpackRscLayerName = `react-server`;
export class RscServerPlugin {
  private clientReferencesMap: ClientReferencesMap = new Map();
  private serverReferencesMap: ServerReferencesMap = new Map();
  private serverManifest: ServerManifest = {};
  private serverManifestFilename: string;
  private styles: Set<string>;

  referencesBefore: any[] = [];

  constructor(options: RscServerPluginOptions) {
    this.styles = new Set();

    this.serverManifestFilename =
      options?.serverManifestFilename || `react-server-manifest.json`;
  }

  private dependencies = [] as any[];

  apply(compiler: Webpack.Compiler): void {
    const {
      EntryPlugin,
      WebpackError,
      // dependencies: { NullDependency },
      // util: {
      //   runtime: { getEntryRuntime },
      // },
      sources: { RawSource },
      // RuntimeGlobals,
    } = compiler.webpack;

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

            this.dependencies.push(dependency);

            // if (!module) {
            //   const noModuleError = new WebpackError(`Module not added`);
            //   noModuleError.file = resource;
            //   compilation.errors.push(noModuleError);

            //   return reject(noModuleError);
            // }

            // const runtime = getEntryRuntime(compilation, entryName, {
            //   name: entryName,
            // });

            // compilation.moduleGraph
            //   .getExportsInfo(module)
            //   .setUsedInUnknownWay(runtime);

            resolve();
          },
        );
      });
    };

    let needsAdditionalPass = false;

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

        sharedData.set(buildInfo?.resourcePath, buildInfo);
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
      }

      return hasChangeReference;
    };

    compiler.hooks.finishMake.tapPromise(
      RscServerPlugin.name,
      async compilation => {
        this.serverManifest = {};
        let hasChangeReference = processModules(compilation.modules);

        const clientReferences = [...this.clientReferencesMap.keys()];
        const serverReferences = [...this.serverReferencesMap.keys()];
        this.referencesBefore = [...clientReferences, ...serverReferences];

        await Promise.all([
          ...clientReferences.map(async resource => {
            try {
              await includeModule(compilation, resource);
            } catch (error) {
              console.error('error', error);
              hasChangeReference = true;
              this.clientReferencesMap.delete(resource);
            }
          }),
          ...serverReferences.map(async resource => {
            try {
              await includeModule(compilation, resource, webpackRscLayerName);
            } catch (error) {
              console.error('error', error);
              hasChangeReference = true;
              this.serverReferencesMap.delete(resource);
            }
          }),
        ]);

        hasChangeReference =
          processModules(compilation.modules) || hasChangeReference;
      },
    );

    compiler.hooks.done.tap(RscServerPlugin.name, () => {
      sharedData.set('serverReferencesMap', this.serverReferencesMap);
      sharedData.set('clientReferencesMap', this.clientReferencesMap);
    });

    compiler.hooks.thisCompilation.tap(
      RscServerPlugin.name,
      (compilation, { normalModuleFactory }) => {
        compilation.hooks.finishModules.tap(RscServerPlugin.name, () => {
          for (const dependency of this.dependencies) {
            const module =
              compilation.moduleGraph.getResolvedModule(dependency);
            if (module) {
              compilation.moduleGraph
                .getExportsInfo(module)
                .setUsedInUnknownWay('main');
            }
          }

          const hasChangeReference = processModules(compilation.modules);
          const referencesAfter = [
            ...this.clientReferencesMap.keys(),
            ...this.serverReferencesMap.keys(),
          ];

          if (
            this.referencesBefore.length !== referencesAfter.length ||
            (!referencesAfter.every(reference =>
              this.referencesBefore.includes(reference),
            ) &&
              hasChangeReference)
          ) {
            needsAdditionalPass = true;
          }
        });

        compilation.hooks.needAdditionalPass.tap(RscServerPlugin.name, () => {
          return !(needsAdditionalPass = !needsAdditionalPass);
        });

        compilation.hooks.processAssets.tap(RscServerPlugin.name, () => {
          compilation.emitAsset(
            this.serverManifestFilename,
            new RawSource(JSON.stringify(this.serverManifest, null, 2), false),
          );
        });
      },
    );

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
  }
}
