/* eslint-disable @typescript-eslint/no-require-imports */
import path from 'path';

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
}) => `import { registerPlugin, mergeRuntimeConfig } from '@${metaName}/runtime/plugin';
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
  return `import { setGlobalContext } from '@${metaName}/runtime/context'

import App from '${path
    .dirname(entry)
    .replace(srcDirectory, internalSrcAlias)}/App';

setGlobalContext({
  App,
});`;
};
