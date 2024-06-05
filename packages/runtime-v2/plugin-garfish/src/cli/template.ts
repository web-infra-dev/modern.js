const genRenderCode = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  isCustomEntry,
  mountId,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  isCustomEntry?: boolean;
  mountId?: string;
}) =>
  isCustomEntry
    ? `import '${entry.replace(srcDirectory, internalSrcAlias)}'
export * from '${entry.replace(srcDirectory, internalSrcAlias)}'`
    : `import { createRoot } from '@${metaName}/runtime-v2/react';
import { render } from '@${metaName}/runtime-v2/client';
import { isRenderGarfish, createProvider } from '@${metaName}/plugin-garfish-v2/runtime';

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
  isCustomEntry,
  mountId,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  entryName: string;
  isCustomEntry?: boolean;
  mountId?: string;
}) =>
  `import '@${metaName}/runtime-v2/registry/${entryName}';
  ${genRenderCode({
    srcDirectory,
    internalSrcAlias,
    metaName,
    entry,
    isCustomEntry,
    mountId,
  })}
  `;
