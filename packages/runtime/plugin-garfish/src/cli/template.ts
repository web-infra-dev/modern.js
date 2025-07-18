import { formatImportPath } from '@modern-js/utils';

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
    ? `import '${formatImportPath(entry.replace(srcDirectory, internalSrcAlias))}'
export * from '${formatImportPath(entry.replace(srcDirectory, internalSrcAlias))}'`
    : `import { createRoot } from '@${metaName}/runtime/react';
import { render } from '@${metaName}/runtime/browser';
import { isRenderGarfish, createProvider } from '@${metaName}/plugin-garfish/tools';
if (!isRenderGarfish()) {
  const ModernRoot = createRoot();
  render(<ModernRoot />, '${mountId || 'root'}');
}

export const provider = createProvider('${mountId || 'root'}');
`;
export const index = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  entryName,
  customEntry,
  mountId,
  appendCode = [],
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  entryName: string;
  customEntry?: boolean;
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
    mountId,
  })}
  ${appendCode.join('\n')}
  `;
