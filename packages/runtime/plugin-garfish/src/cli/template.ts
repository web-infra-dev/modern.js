const genRenderCode = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  customEntry,
  mountId,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  customEntry?: boolean;
  mountId?: string;
}) =>
  customEntry
    ? `import '${entry.replace(srcDirectory, internalSrcAlias)}'
export * from '${entry.replace(srcDirectory, internalSrcAlias)}'`
    : `import { garfishRender, createProvider } from '@${metaName}/plugin-garfish/runtime';

garfishRender('${mountId || 'root'}' )

export const provider = createProvider();
`;
export const index = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  entryName,
  customEntry,
  mountId,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  entryName: string;
  customEntry?: boolean;
  mountId?: string;
}) =>
  `import '@${metaName}/runtime/registry/${entryName}';
  ${genRenderCode({
    srcDirectory,
    internalSrcAlias,
    metaName,
    entry,
    customEntry,
    mountId,
  })}
  `;
