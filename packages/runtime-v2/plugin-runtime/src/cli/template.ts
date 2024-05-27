/* eslint-disable @typescript-eslint/no-require-imports */
import path from 'path';
import {
  ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME,
  ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME,
} from './constants';

export const index = ({
  srcDirectory,
  internalSrcAlias,
  entryName,
  entry,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  entryName: string;
  entry: string;
}) =>
  `import '@modern-js/runtime-v2/register/${entryName}';
import '${entry.replace(srcDirectory, internalSrcAlias)}'`;

export const register =
  () => `import './${ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME}';
import './${ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME}';
`;

const getImportRuntimeConfigCode = (
  srcDirectory: string,
  internalSrcAlias: string,
  runtimeConfigFile: string,
) => {
  try {
    // eslint-disable-next-line import/no-dynamic-require
    require(path.join(srcDirectory, runtimeConfigFile));
    return `import runtimeConfig from '${internalSrcAlias}/${runtimeConfigFile}';`;
  } catch (e) {
    return `let runtimeConfig`;
  }
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
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
}) => {
  return `import { setGlobalContext } from '@${metaName}/runtime-v2/context'

import App from '${entry
    .replace('/entry.tsx', '')
    .replace(srcDirectory, internalSrcAlias)}/App';

setGlobalContext({
  App,
});`;
};
