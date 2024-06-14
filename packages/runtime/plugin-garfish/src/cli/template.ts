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
  customEntry?: string | false;
  mountId?: string;
}) =>
  customEntry
    ? `import '${entry.replace(srcDirectory, internalSrcAlias)}'
export * from '${entry.replace(srcDirectory, internalSrcAlias)}'`
    : `import { createRoot } from '@${metaName}/runtime/react';
import { render } from '@${metaName}/runtime/client';
import { isRenderGarfish, createProvider } from '@${metaName}/plugin-garfish/runtime';

if (!isRenderGarfish()) {
  const ModernRoot = createRoot();

  render(<ModernRoot />, '${mountId || 'root'}');
}

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
  customEntry?: string | false;
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
