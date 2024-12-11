import path from 'path';
import type { RuntimePlugin } from '@modern-js/app-tools';
import { JS_EXTENSIONS, findExists, formatImportPath } from '@modern-js/utils';
import {
  ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME,
  ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME,
} from './constants';

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
}) => {
  if (customEntry) {
    return `import '${formatImportPath(
      entry.replace(srcDirectory, internalSrcAlias),
    )}'`;
  }
  return `import { createRoot } from '@${metaName}/runtime/react';
import { render } from '@${metaName}/runtime/browser';
${
  customBootstrap
    ? `import customBootstrap from '${formatImportPath(
        customBootstrap.replace(srcDirectory, internalSrcAlias),
      )}';`
    : ''
}

const ModernRoot = createRoot();

${
  customBootstrap
    ? `customBootstrap(ModernRoot, () => render(<ModernRoot />, '${
        mountId || 'root'
      }'));`
    : `render(<ModernRoot />, '${mountId || 'root'}');`
}`;
};

export const index = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  entryName,
  customEntry,
  customBootstrap,
  mountId,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  entryName: string;
  customEntry?: boolean;
  customBootstrap?: string | false;
  mountId?: string;
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
`;

export const register =
  () => `import './${ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME}';
import './${ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME}';
`;

const getImportRuntimeConfigCode = (
  srcDirectory: string,
  internalSrcAlias: string,
  runtimeConfigFile: string | false,
) => {
  if (
    runtimeConfigFile &&
    findExists(
      JS_EXTENSIONS.map(ext =>
        path.resolve(srcDirectory, `${runtimeConfigFile}${ext}`),
      ),
    )
  ) {
    return `import runtimeConfig from '${internalSrcAlias}/${runtimeConfigFile}';`;
  }
  return `let runtimeConfig;`;
};

const getRegisterRuntimePluginCode = (
  entryName: string,
  name: string,
  config: Record<string, any>,
) => {
  const configName = name === 'garfish' ? 'masterApp' : name;
  return `plugins.push(${name}Plugin(mergeConfig(${JSON.stringify(
    config,
  )}, (runtimeConfig || {})['${configName}'], ((runtimeConfig || {})['${configName}ByEntries'] || {})['${entryName}'], (getGlobalAppConfig() || {})['${configName}'])));`;
};

export const runtimeRegister = ({
  entryName,
  srcDirectory,
  internalSrcAlias,
  metaName,
  runtimeConfigFile,
  runtimePlugins,
}: {
  entryName: string;
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  runtimeConfigFile: string | false;
  runtimePlugins: RuntimePlugin[];
}) => `import { registerPlugin, mergeConfig } from '@${metaName}/runtime/plugin';
import { getGlobalAppConfig, getGlobalLayoutApp } from '@${metaName}/runtime/context';
${getImportRuntimeConfigCode(srcDirectory, internalSrcAlias, runtimeConfigFile)}

const plugins = [];

${runtimePlugins
  .map(
    ({ name, path, config }) => `import { ${name}Plugin } from '${path}';

${getRegisterRuntimePluginCode(entryName, name, config)}
`,
  )
  .join('\n')}
registerPlugin(plugins, runtimeConfig);
`;

export const runtimeGlobalContext = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  customEntry,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  customEntry?: boolean;
}) => {
  return `import { setGlobalContext } from '@${metaName}/runtime/context'

setGlobalContext({});`;
};
