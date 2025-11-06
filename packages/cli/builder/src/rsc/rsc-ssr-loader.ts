import type { Rspack } from '@rsbuild/core';
import {
  type SourceMap,
  getExportNames,
  isServerModule,
  parseSource,
  setRscBuildInfo,
} from './common';

export type RscSsrLoaderOptions = {
  entryPath2Name: Map<string, string>;
};

export default async function rscSsrLoader(
  this: Rspack.LoaderContext<RscSsrLoaderOptions>,
  source: string,
  sourceMap: SourceMap,
) {
  this.cacheable(true);
  const callback = this.async();
  const ast = await parseSource(source);
  const hasDeclareServerDirective = await isServerModule(ast);
  const resourcePath = this.resourcePath;
  if (!hasDeclareServerDirective) {
    callback(null, source, sourceMap);
    return;
  }

  const exportedNames = await getExportNames(ast, true);
  const importsCode = `
    'use server';
  `;

  const exportsCode = exportedNames
    .map(name => {
      if (name === 'default') {
        return `export default () => {throw new Error("Server actions must not be called during server-side rendering.")}`;
      } else {
        return `export const ${name} = () => {
          throw new Error("Server actions must not be called during server-side rendering.")
        }`;
      }
    })
    .join('\n');

  if (exportedNames.length > 0) {
    setRscBuildInfo(this._module!, {
      type: 'server',
      resourcePath,
      exportNames: exportedNames,
    });
  }

  callback(null, `${importsCode}\n${exportsCode}`, sourceMap);
  return;
}
