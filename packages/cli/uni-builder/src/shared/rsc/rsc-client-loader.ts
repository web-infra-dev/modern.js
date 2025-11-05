import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type { LoaderContext } from 'webpack';
import {
  type ServerReferencesModuleInfo,
  type SourceMap,
  getExportNames,
  isServerModule,
  parseSource,
  sharedData,
} from './common';

export type ClientLoaderOptions = {
  callServerImport?: string;
  registerImport?: string;
};

type ServerReferencesManifestEntry = {
  path: string;
  exports: string[];
  moduleId?: string | number | null;
};

type ServerReferencesManifest = {
  serverReferences: ServerReferencesManifestEntry[];
};

export default async function rscClientLoader(
  this: LoaderContext<ClientLoaderOptions>,
  source: string,
  sourceMap: SourceMap,
) {
  this.cacheable(true);
  const callback = this.async();
  const ast = await parseSource(source);
  const hasUseServerDirective = await isServerModule(ast);

  if (!hasUseServerDirective) {
    callback(null, source, sourceMap);
    return;
  }

  const {
    callServerImport = `@modern-js/runtime/rsc/client`,
    registerImport = `@modern-js/runtime/rsc/client`,
  } = this.getOptions();

  // Normalize resource path for consistent lookups
  const normalizedResource = path
    .resolve(this.resourcePath)
    .replace(/\\/g, '/');

  const buildInfo =
    sharedData.get<ServerReferencesModuleInfo>(normalizedResource);
  let moduleInfo = buildInfo
    ? {
        moduleId: buildInfo?.moduleId,
        exportNames: buildInfo?.exportNames,
      }
    : null;

  if (!moduleInfo) {
    const serverModuleInfoMap = sharedData.get<
      Map<string, ServerReferencesModuleInfo>
    >('serverModuleInfoMap');

    const infoFromMap = serverModuleInfoMap?.get(normalizedResource);
    if (infoFromMap) {
      moduleInfo = {
        moduleId: infoFromMap.moduleId ?? undefined,
        exportNames: infoFromMap.exportNames,
      };
    }
  }

  // Ensure we have export names even if the server plugin hasn't populated
  // sharedData yet by deriving them from the current AST.
  if (
    !moduleInfo ||
    !moduleInfo.exportNames ||
    moduleInfo.exportNames.length === 0
  ) {
    try {
      const names = await getExportNames(ast, true);
      if (names && names.length > 0) {
        moduleInfo = moduleInfo || {
          moduleId: undefined as any,
          exportNames: [],
        };
        moduleInfo.exportNames = names;
      }
    } catch {}
  }

  // Retry loop: the server manifest may be written later than the client
  // transform runs. Poll with a larger budget to reduce flakiness.
  if (!moduleInfo || !moduleInfo.moduleId) {
    const tryHydrateFromManifest = () => {
      let manifestPath = sharedData.get<string>('serverReferencesManifestPath');
      if (!manifestPath) {
        const candidates = [
          path.join(
            this.rootContext,
            'dist',
            'server',
            'server-references-manifest.json',
          ),
          path.join(
            this.rootContext,
            'dist',
            'bundles',
            'server-references-manifest.json',
          ),
        ];
        manifestPath = candidates.find(p => existsSync(p));
      }
      if (manifestPath && existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(
            readFileSync(manifestPath, 'utf-8'),
          ) as ServerReferencesManifest;
          const entry = manifest.serverReferences.find(
            item => item.path === normalizedResource,
          );
          if (entry) {
            if (process.env.DEBUG_RSC_PLUGIN) {
              console.log(
                '[rsc-client-loader] retry hydrate from',
                manifestPath,
                'entry:',
                entry,
              );
            }
            moduleInfo = moduleInfo || {
              moduleId: undefined,
              exportNames: entry.exports,
            };
            if (entry.moduleId != null) {
              moduleInfo.moduleId = entry.moduleId;
            }
          }
        } catch {}
      }
    };
    const maxAttempts = Number(process.env.RSC_CLIENT_LOADER_ATTEMPTS || 30);
    const delayMs = Number(process.env.RSC_CLIENT_LOADER_DELAY_MS || 100);
    for (
      let i = 0;
      i < maxAttempts && (!moduleInfo || !moduleInfo.moduleId);
      i++
    ) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      tryHydrateFromManifest();
    }
  }

  // Advertise discovered server references to the server compiler via sharedData.
  // This lets the server plugin include server action modules that only exist in
  // the web graph (common in CSR remotes) so they get a stable moduleId.
  try {
    const names = moduleInfo?.exportNames;
    if (names && names.length > 0) {
      const candidatesKey = 'serverModuleInfoCandidates';
      const candidates = (sharedData.get<
        Map<string, ServerReferencesModuleInfo>
      >(candidatesKey) || new Map()) as Map<string, ServerReferencesModuleInfo>;
      const existing = candidates.get(normalizedResource);
      const mergedExports = Array.from(
        new Set([...(existing?.exportNames || []), ...names]),
      );
      const merged: ServerReferencesModuleInfo = {
        exportNames: mergedExports,
        ...(existing?.moduleId !== undefined && {
          moduleId: existing.moduleId,
        }),
      };
      candidates.set(normalizedResource, merged);
      sharedData.set(candidatesKey, candidates);
    }
  } catch {}

  // If we found export names but the moduleId is still missing, try to
  // hydrate it from the persisted manifest file.
  if (moduleInfo && !moduleInfo.moduleId) {
    let manifestPath = sharedData.get<string>('serverReferencesManifestPath');
    if (!manifestPath) {
      const candidates = [
        path.join(
          this.rootContext,
          'dist',
          'server',
          'server-references-manifest.json',
        ),
        path.join(
          this.rootContext,
          'dist',
          'bundles',
          'server-references-manifest.json',
        ),
      ];
      manifestPath = candidates.find(p => existsSync(p));
    }
    if (manifestPath && existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(
          readFileSync(manifestPath, 'utf-8'),
        ) as ServerReferencesManifest;
        const entry = manifest.serverReferences.find(
          item => item.path === normalizedResource,
        );
        if (entry && entry.moduleId != null) {
          moduleInfo.moduleId = entry.moduleId;
        }
      } catch {}
    }
  }

  if (!moduleInfo) {
    // Try shared manifest path; otherwise, search common output locations.
    let manifestPath = sharedData.get<string>('serverReferencesManifestPath');
    if (!manifestPath) {
      const candidates = [
        path.join(
          this.rootContext,
          'dist',
          'server',
          'server-references-manifest.json',
        ),
        path.join(
          this.rootContext,
          'dist',
          'bundles',
          'server-references-manifest.json',
        ),
      ];
      manifestPath = candidates.find(p => existsSync(p));
    }

    if (manifestPath && existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(
          readFileSync(manifestPath, 'utf-8'),
        ) as ServerReferencesManifest;

        const entry = manifest.serverReferences.find(
          item => item.path === normalizedResource,
        );

        if (entry) {
          moduleInfo = {
            moduleId: entry.moduleId ?? undefined,
            exportNames: entry.exports,
          };
        }
      } catch {
        // Ignore malformed manifest; fall through to existing error.
      }
    }
  }

  if (!moduleInfo) {
    if (process.env.DEBUG_RSC_PLUGIN) {
      console.log(
        `[rsc-client-loader] missing build info for ${normalizedResource}. Known keys: ${Array.from(
          sharedData.store.keys(),
        ).join(', ')}`,
      );
    }
    this.emitError(
      new Error(
        `Could not find server module info in \`serverReferencesMap\` for ${normalizedResource}.`,
      ),
    );

    callback(null, '');
    return;
  }

  const { exportNames } = moduleInfo;
  let moduleId = moduleInfo.moduleId;
  if (process.env.DEBUG_RSC_PLUGIN) {
    console.log(
      '[rsc-client-loader] final moduleInfo:',
      normalizedResource,
      moduleInfo,
    );
  }

  if (!moduleId) {
    // One last attempt: read manifest now that the server build likely finished
    let manifestPath = sharedData.get<string>('serverReferencesManifestPath');
    if (process.env.DEBUG_RSC_PLUGIN) {
      console.log(
        '[rsc-client-loader] manifestPath from sharedData:',
        manifestPath,
      );
    }
    if (!manifestPath) {
      const candidates = [
        path.join(
          this.rootContext,
          'dist',
          'server',
          'server-references-manifest.json',
        ),
        path.join(
          this.rootContext,
          'dist',
          'bundles',
          'server-references-manifest.json',
        ),
      ];
      if (process.env.DEBUG_RSC_PLUGIN) {
        console.log('[rsc-client-loader] searching candidates:', candidates);
      }
      manifestPath = candidates.find(p => existsSync(p));
      if (process.env.DEBUG_RSC_PLUGIN) {
        console.log('[rsc-client-loader] found manifestPath:', manifestPath);
      }
    }
    if (manifestPath && existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(
          readFileSync(manifestPath, 'utf-8'),
        ) as ServerReferencesManifest;
        if (process.env.DEBUG_RSC_PLUGIN) {
          console.log(
            '[rsc-client-loader] loaded manifest with',
            manifest.serverReferences.length,
            'entries',
          );
        }
        const entry = manifest.serverReferences.find(
          item => item.path === normalizedResource,
        );
        if (entry && entry.moduleId != null) {
          moduleId = entry.moduleId as any;
          if (process.env.DEBUG_RSC_PLUGIN) {
            console.log(
              '[rsc-client-loader] hydrated moduleId from manifest:',
              moduleId,
              'for',
              normalizedResource,
            );
          }
        } else {
          if (process.env.DEBUG_RSC_PLUGIN) {
            console.log(
              '[rsc-client-loader] no matching entry in manifest for',
              normalizedResource,
            );
          }
        }
      } catch (err) {
        if (process.env.DEBUG_RSC_PLUGIN) {
          console.warn('[rsc-client-loader] failed to read manifest:', err);
        }
      }
    } else {
      if (process.env.DEBUG_RSC_PLUGIN) {
        console.log('[rsc-client-loader] manifest file not found');
      }
    }
  }

  if (!moduleId) {
    this.emitError(
      new Error(
        `Could not find server module ID in \`serverReferencesMap\` for ${normalizedResource}.`,
      ),
    );

    callback(null, '');
    return;
  }

  if (!exportNames) {
    callback(null, '');
    return;
  }

  const importsCode = `
    import { createServerReference } from "${registerImport}";
    import { callServer } from "${callServerImport}";
  `;

  const exportsCode = exportNames
    .map(item => {
      const name = item;
      if (name === 'default') {
        return `export default createServerReference("${moduleId}", callServer);`;
      } else {
        return `export const ${name} = createServerReference("${moduleId}#${name}", callServer);`;
      }
    })
    .join('\n');

  callback(null, `${importsCode}\n${exportsCode}`);
  return;
}
