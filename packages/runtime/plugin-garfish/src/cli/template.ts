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
    : `import { createRoot } from '@${metaName}/runtime/react';
import { render } from '@${metaName}/runtime/browser';
import { isRenderGarfish, createProvider } from '@${metaName}/plugin-garfish/tools';
${
  customBootstrap
    ? `import customBootstrap from '${formatImportPath(
        customBootstrap.replace(srcDirectory, internalSrcAlias),
      )}';`
    : 'let customBootstrap;'
}
if (!isRenderGarfish()) {
  const ModernRoot = createRoot();
  ${
    customBootstrap
      ? `customBootstrap(ModernRoot, () => render(<ModernRoot />, '${
          mountId || 'root'
        }'));`
      : `render(<ModernRoot />, '${mountId || 'root'}');`
  };
}

export const provider = createProvider('${
        mountId || 'root'
      }', { customBootstrap });
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
