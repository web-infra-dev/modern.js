import path from 'path';
import { JS_EXTENSIONS, findExists } from '@modern-js/utils';
import type { RuntimePlugin } from '@modern-js/app-tools';
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
    ? `import '${entry.replace(srcDirectory, internalSrcAlias)}'`
    : `import { createRoot } from '@${metaName}/runtime/react';
import { render } from '@${metaName}/runtime/client';

const ModernRoot = createRoot();

render(<ModernRoot />, '${mountId || 'root'}');`;
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
  return `let runtimeConfig`;
};

const getRegisterRuntimePluginCode = (
  name: string,
  config: Record<string, any>,
) =>
  name === 'router'
    ? `plugins.push(${name}Plugin(mergeConfig(${JSON.stringify(
        config,
      )}, (runtimeConfig || {})['${name}'], { routesConfig: { routes: getGlobalRoutes() } })));`
    : `plugins.push(${name}Plugin(mergeConfig(${JSON.stringify(
        config,
      )}, (runtimeConfig || {})['${name}'])));`;

export const runtimeRegister = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  runtimeConfigFile,
  runtimePlugins,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  runtimeConfigFile: string | false;
  runtimePlugins: RuntimePlugin[];
}) => `import { registerPlugin, mergeConfig } from '@${metaName}/runtime/plugin';
import { getGlobalRoutes } from '@${metaName}/runtime/context';
${getImportRuntimeConfigCode(srcDirectory, internalSrcAlias, runtimeConfigFile)}

const plugins = [];

${runtimePlugins
  .map(
    ({
      name,
      implementation,
      config,
    }) => `import { ${name}Plugin } from '${implementation}';

${getRegisterRuntimePluginCode(name, config)}
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
  customEntry?: string | false;
}) => {
  return `import { setGlobalContext } from '@${metaName}/runtime/context'

import App from '${
    customEntry
      ? entry
          .replace('entry.tsx', 'App.tsx')
          .replace(srcDirectory, internalSrcAlias)
      : entry.replace(srcDirectory, internalSrcAlias)
  }';

setGlobalContext({
  App,
});`;
};
