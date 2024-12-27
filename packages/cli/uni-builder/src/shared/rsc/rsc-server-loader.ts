import path from 'node:path';
import MagicString from 'magic-string';
import type { LoaderContext, Module } from 'webpack';
import {
  type ClientReference,
  type SourceMap,
  findRootIssuer,
  getExportNames,
  isClientModule,
  parseSource,
  setRscBuildInfo,
} from './common';
import {
  getModuleUseServerInfo,
  getServerActions,
  parseSourceWithOxc,
} from './parse-with-oxc';

export type RscServerLoaderOptions = {
  runtimeExport: string;
  entryPath2Name: Map<string, string>;
};

export default async function rscServerLoader(
  this: LoaderContext<RscServerLoaderOptions>,
  source: string,
  sourceMap: SourceMap,
) {
  this.cacheable(true);
  const callback = this.async();
  const clientReferences: ClientReference[] = [];
  const { resourcePath } = this;
  const { entryPath2Name } = this.getOptions();
  const ast = await parseSource(source);
  const isClientComponent = await isClientModule(ast);
  const { runtimeExport = '@modern-js/runtime/rsc/server' } = this.getOptions();

  if (isClientComponent) {
    const importsCode = `
'use client';

import { registerClientReference } from "${runtimeExport}";
function createClientReferenceProxy(exportName) {
  return () => {
    throw new Error(\`Attempted to call \${exportName}() from the server but \${exportName} is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.\`);
  };
}`;

    const exportNames = await getExportNames(ast);
    const exportsCode = exportNames
      .map(exportName => {
        const id = `${path.relative(process.cwd(), resourcePath)}#${exportName || ''}`;
        clientReferences.push({ id, exportName });
        if (exportName === 'default') {
          return `export default registerClientReference(() => {
  throw new Error("Attempted to call the default export of ${resourcePath} from the server but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "${id}", "${exportName}");`;
        } else {
          return `export const ${exportName} = registerClientReference(createClientReferenceProxy("${exportName}"), "${id}", "${exportName}");`;
        }
      })
      .join('\n');

    if (clientReferences.length > 0) {
      const entryPath = (findRootIssuer(this._module!) as any)
        .resource as string;
      const entryName = entryPath2Name.get(entryPath);
      setRscBuildInfo(this._module!, {
        type: 'client',
        resourcePath,
        clientReferences,
        __entryName: entryName,
        __entryPath: entryPath,
      });
    }

    return callback(null, `${importsCode}\n${exportsCode}`);
  } else {
    const ast = await parseSourceWithOxc(source, resourcePath);
    const moduleUseServerInfo = getModuleUseServerInfo(ast);
    const serverFunctions = getServerActions(ast);
    const serverReferenceExportNames: string[] = serverFunctions
      .map(serverFunc => serverFunc.exportName)
      .filter(Boolean) as string[];

    if (serverReferenceExportNames.length > 0) {
      const entryPath = (findRootIssuer(this._module!) as any)
        .resource as string;
      const entryName = entryPath2Name.get(entryPath);
      setRscBuildInfo(this._module!, {
        type: 'server',
        resourcePath,
        exportNames: serverReferenceExportNames,
        __entryName: entryName,
        __entryPath: entryPath,
      });
    }

    if (serverFunctions.length > 0) {
      const ms = new MagicString(source);
      serverFunctions.forEach(serverFunction => {
        ms.appendRight(
          serverFunction.span.end,
          `\nregisterServerReference(${serverFunction.localName}, module.id, "${serverFunction.exportName || serverFunction.localName}");`,
        );
      });

      const useServerPos = moduleUseServerInfo ? moduleUseServerInfo.end : 0;
      ms.appendRight(
        useServerPos,
        `\nimport { registerServerReference } from "${runtimeExport}";`,
      );

      return callback(null, ms.toString());
    }
  }

  return callback(null, source, sourceMap);
}
