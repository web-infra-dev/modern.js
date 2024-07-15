import { formatImportPath } from '@modern-js/utils';

const genRenderCode = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  customEntry,
  customBootstrap,
  mountId,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  customEntry?: boolean;
  customBootstrap?: string | false;
  mountId?: string;
}) =>
  customEntry
    ? `import '${entry.replace(srcDirectory, internalSrcAlias)}'
export * from '${entry.replace(srcDirectory, internalSrcAlias)}'`
    : `import { garfishRender, createProvider } from '@${metaName}/plugin-garfish/runtime';

${
  customBootstrap
    ? `import customBootstrap from '${formatImportPath(
        customBootstrap.replace(srcDirectory, internalSrcAlias),
      )}';`
    : 'let customBootstrap;'
}
garfishRender('${mountId || 'root'}', customBootstrap)

export const provider = createProvider(undefined, ${
        customBootstrap ? 'customBootstrap' : undefined
      });
`;
export const index = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  entryName,
  customEntry,
  customBootstrap,
  mountId,
  appendCode = [],
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  entryName: string;
  customEntry?: boolean;
  customBootstrap?: string | false;
  mountId?: string;
  appendCode?: string[];
}) =>
  `import '@${metaName}/runtime/registry/${entryName}';
  ${genRenderCode({
    srcDirectory,
    internalSrcAlias,
    metaName,
    entry,
    customEntry,
    customBootstrap,
    mountId,
  })}
  ${appendCode.join('\n')}
  `;
