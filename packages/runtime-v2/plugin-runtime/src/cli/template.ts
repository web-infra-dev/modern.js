import path from 'path';
import { findExists } from '@modern-js/utils';
import type { RuntimePlugin } from '@modern-js/app-tools-v2';
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
    ? `import '${entry.replace(srcDirectory, internalSrcAlias)}'`
    : `import { createRoot } from '@${metaName}/runtime-v2/react';
import { render } from '@${metaName}/runtime-v2/client';

const ModernRoot = createRoot();

render(<ModernRoot />, '${mountId || 'root'}');`;
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

export const register =
  () => `import './${ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME}';
import './${ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME}';
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

const getRegisterRuntimePluginCode = (
  name: string,
  config: Record<string, any>,
) =>
  name === 'router'
    ? `plugins.push(${name}Plugin(mergeConfig(${JSON.stringify(
        config,
      )}, runtimeConfig['${name}'], { routesConfig: { routes: getGlobalRoutes() } })));`
    : `plugins.push(${name}Plugin(mergeConfig(${JSON.stringify(
        config,
      )}, runtimeConfig['${name}'])));`;

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
  runtimeConfigFile: string;
  runtimePlugins: RuntimePlugin[];
}) => `import { registerPlugin, mergeConfig } from '@${metaName}/runtime-v2/plugin';
import { getGlobalRoutes } from '@${metaName}/runtime-v2/context';
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
