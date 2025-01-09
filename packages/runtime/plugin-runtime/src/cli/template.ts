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
  enableRsc,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  customEntry?: boolean;
  customBootstrap?: string | false;
  mountId?: string;
  enableRsc?: boolean;
}) => {
  if (customEntry) {
    return `import '${formatImportPath(
      entry.replace(srcDirectory, internalSrcAlias),
    )}'`;
  }
  return `import { createRoot } from '@${metaName}/runtime/react';
import { render } from '@${metaName}/runtime/browser';

${
  enableRsc
    ? `import { RscClientRoot, createFromReadableStream, rscStream, callServer } from '@${metaName}/runtime/rsc/client';`
    : ''
}

${
  enableRsc
    ? `const data = createFromReadableStream(rscStream, {
    callServer: callServer,
  });`
    : ''
}

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
    : enableRsc
      ? `render(<ModernRoot>
                  <RscClientRoot data={data} />
                </ModernRoot>, '${mountId || 'root'}');`
      : `render(<ModernRoot />, '${mountId || 'root'}');`
}`;
};

export const entryForCSRWithRSC = ({
  metaName,
  entryName,
}: {
  metaName: string;
  entryName: string;
}) => {
  return `
  import '@${metaName}/runtime/registry/${entryName}';
  import { render } from '@${metaName}/runtime/browser';
  import { createRoot } from '@${metaName}/runtime/react';

  import {
    RscClientRoot,
    createFromFetch
  } from '@${metaName}/runtime/rsc/client';

  const content = createFromFetch(
    fetch('/', {
      headers: {
        'x-rsc-tree': 'true',
      },
    }),
  );

  const ModernRoot = createRoot();

  render(
    <ModernRoot>
      <RscClientRoot data={content} />
    </ModernRoot>,
    'root',
  );
  `;
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
  enableRsc,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  entryName: string;
  customEntry?: boolean;
  customBootstrap?: string | false;
  mountId?: string;
  enableRsc?: boolean;
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
  enableRsc,
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

import App from '${
    // We need to get the path of App.tsx here, but the entry is `src/entry.tsx`
    formatImportPath(
      customEntry
        ? entry
            .replace(/entry\.[tj]sx/, 'App')
            .replace(srcDirectory, internalSrcAlias)
        : entry.replace(srcDirectory, internalSrcAlias).replace(/\.[tj]sx/, ''),
    )
  }';

setGlobalContext({
  App,
});`;
};

export const runtimeGlobalContextForRSCServer = ({
  metaName,
}: {
  metaName: string;
}) => {
  return `
  import { createElement, Fragment } from 'react';
  import { setGlobalContext } from '@${metaName}/runtime/context';
  import AppProxy from './AppProxy';

  const DefaultRoot = ({ children }: { children?: ReactNode }) =>
    createElement(Fragment, null, children);


  setGlobalContext({
    App: DefaultRoot,
    RSCRoot: AppProxy,
  });`;
};

export const runtimeGlobalContextForRSCClient = ({
  metaName,
}: {
  metaName: string;
}) => {
  return `
  import { createElement, Fragment } from 'react';
  import { setGlobalContext } from '@${metaName}/runtime/context';

  const DefaultRoot = ({ children }: { children?: ReactNode }) =>
    createElement(Fragment, null, children);

  setGlobalContext({
    App: DefaultRoot
  });`;
};

export const AppProxyForRSC = ({
  srcDirectory,
  internalSrcAlias,
  entry,
  customEntry,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  entry: string;
  customEntry?: boolean;
}) => {
  return `
  import App from '${
    // We need to get the path of App.tsx here, but the entry is `src/entry.tsx`
    formatImportPath(
      customEntry
        ? entry
            .replace('entry.tsx', 'App')
            .replace(srcDirectory, internalSrcAlias)
        : entry.replace(srcDirectory, internalSrcAlias).replace('.tsx', ''),
    )
  }';

   import React from 'react';

    export default function Root() {
      return React.createElement(App, null);
    }
  `;
};
