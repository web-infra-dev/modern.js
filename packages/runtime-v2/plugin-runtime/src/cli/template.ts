import path from 'path';
import { findExists } from '@modern-js/utils';
import {
  ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME,
  ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME,
  JS_EXTENSIONS,
} from './constants';

const genRenderCode = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  isCustomEntry,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  isCustomEntry?: boolean;
}) =>
  isCustomEntry
    ? `import '${entry.replace(srcDirectory, internalSrcAlias)}'`
    : `import { createRoot } from '@${metaName}/runtime-v2/react';
import { render } from '@${metaName}/runtime-v2/client';

const ModernRoot = createRoot();

render(<ModernRoot />);`;
export const index = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  entryName,
  isCustomEntry,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  entryName: string;
  isCustomEntry?: boolean;
}) =>
  `import '@${metaName}/runtime-v2/registry/${entryName}';
${genRenderCode({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  isCustomEntry,
})}
`;

export const register =
  () => `import './${ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME}';
import './${ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME}';
`;

const getImportRuntimeConfigCode = (
  srcDirectory: string,
  internalSrcAlias: string,
  runtimeConfigFile: string,
) => {
  if (
    findExists(
      JS_EXTENSIONS.map(ext =>
        path.resolve(srcDirectory, `${runtimeConfigFile}${ext}`),
      ),
    )
  ) {
    return `import runtimeConfig from '${internalSrcAlias}/${runtimeConfigFile}';`;
  }
  return `let runtimeConfig`;
};

export const runtimeRegister = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  runtimeConfigFile,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  runtimeConfigFile: string;
}) => `import { registerPlugin, mergeRuntimeConfig } from '@${metaName}/runtime-v2/plugin';
${getImportRuntimeConfigCode(srcDirectory, internalSrcAlias, runtimeConfigFile)}
import cliRuntimeConfig from './runtime-config.json';

registerPlugin(mergeRuntimeConfig(runtimeConfig, cliRuntimeConfig));
`;

export const runtimeGlobalContext = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  isCustomEntry,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  isCustomEntry?: boolean;
}) => {
  return `import { setGlobalContext } from '@${metaName}/runtime-v2/context'

import App from '${
    isCustomEntry
      ? entry
          .replace('entry.tsx', 'App.tsx')
          .replace(srcDirectory, internalSrcAlias)
      : entry.replace(srcDirectory, internalSrcAlias)
  }';

setGlobalContext({
  App,
});`;
};
