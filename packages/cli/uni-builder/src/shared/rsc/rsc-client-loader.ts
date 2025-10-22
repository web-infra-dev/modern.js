import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type { LoaderContext } from 'webpack';
import {
  type ServerReferencesModuleInfo,
  type SourceMap,
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

  const buildInfo = sharedData.get<ServerReferencesModuleInfo>(
    this.resourcePath,
  );
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

    const infoFromMap = serverModuleInfoMap?.get(this.resourcePath);
    if (infoFromMap) {
      moduleInfo = {
        moduleId: infoFromMap.moduleId ?? undefined,
        exportNames: infoFromMap.exportNames,
      };
    }
  }

  if (!moduleInfo) {
    const manifestPath =
      sharedData.get<string>('serverReferencesManifestPath') ||
      path.join(
        this.rootContext,
        'dist',
        'server',
        'server-references-manifest.json',
      );

    if (manifestPath && existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(
          readFileSync(manifestPath, 'utf-8'),
        ) as ServerReferencesManifest;

        const entry = manifest.serverReferences.find(
          item => item.path === this.resourcePath,
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
        `[rsc-client-loader] missing build info for ${this.resourcePath}. Known keys: ${Array.from(
          sharedData.store.keys(),
        ).join(', ')}`,
      );
    }
    this.emitError(
      new Error(
        `Could not find server module info in \`serverReferencesMap\` for ${this.resourcePath}.`,
      ),
    );

    callback(null, '');
    return;
  }

  const { moduleId, exportNames } = moduleInfo;

  if (!moduleId) {
    this.emitError(
      new Error(
        `Could not find server module ID in \`serverReferencesMap\` for ${this.resourcePath}.`,
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
