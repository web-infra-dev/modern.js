import type { Rspack } from '@rsbuild/core';
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

export default async function rscClientLoader(
  this: Rspack.LoaderContext<ClientLoaderOptions>,
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

  const moduleInfo = buildInfo
    ? {
        moduleId: buildInfo?.moduleId,
        exportNames: buildInfo?.exportNames,
      }
    : null;

  if (!moduleInfo) {
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
        return `export var ${name} = createServerReference("${moduleId}#${name}", callServer);`;
      }
    })
    .join('\n');

  callback(null, `${importsCode}\n${exportsCode}`);
  return;
}
