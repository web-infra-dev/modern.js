import path from 'path';
import type { RuntimePluginConfig } from '@modern-js/app-tools';
import { JS_EXTENSIONS, findExists, formatImportPath } from '@modern-js/utils';
import {
  ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME,
  ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME,
} from './constants';

const genRenderStatement = ({
  customBootstrap,
  enableRsc,
  mountId,
  isNestedRouter,
}: {
  customBootstrap?: string | false;
  enableRsc?: boolean;
  mountId?: string;
  isNestedRouter?: boolean;
}) => {
  if (customBootstrap) {
    return `customBootstrap(ModernRoot, () => render(<ModernRoot />, '${
      mountId || 'root'
    }'));`;
  }

  if (enableRsc) {
    if (!isNestedRouter) {
      return `render(<ModernRoot>
                  <RscClientRoot rscPayload={data} />
                </ModernRoot>, '${mountId || 'root'}');`;
    }
    return `render(<ModernRoot rscPayload={data} />, '${mountId || 'root'}');`;
  }

  return `render(<ModernRoot />, '${mountId || 'root'}');`;
};

const genRenderCode = ({
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  customEntry,
  customBootstrap,
  mountId,
  enableRsc,
  isNestedRouter,
}: {
  srcDirectory: string;
  internalSrcAlias: string;
  metaName: string;
  entry: string;
  customEntry?: boolean;
  customBootstrap?: string | false;
  mountId?: string;
  enableRsc?: boolean;
  isNestedRouter?: boolean;
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

${genRenderStatement({
  customBootstrap,
  enableRsc,
  mountId,
  isNestedRouter,
})}`;
};

export const entryForCSRWithRSC = ({
  metaName,
  entryName,
  urlPath = '/',
  mountId = 'root',
  isNestedRouter,
}: {
  metaName: string;
  entryName: string;
  urlPath?: string;
  mountId?: string;
  isNestedRouter?: string;
}) => {
  return `
  import '@${metaName}/runtime/registry/${entryName}';
  import { render } from '@${metaName}/runtime/browser';
  import { createRoot } from '@${metaName}/runtime/react';

  import {
    RscClientRoot,
    createFromFetch,
    isRedirectResponse
  } from '@${metaName}/runtime/rsc/client';

  const handleRedirectResponse = (res: Response) => {
    const { headers } = res;
    const location = headers.get('X-Modernjs-Redirect');
    const baseUrl = headers.get('X-Modernjs-BaseUrl');
    if (location) {
      if (baseUrl !== '/') {
        window.location.replace(baseUrl + location);
      } else {
        window.location.replace(location);
      }
      return;
    }
    return res;
  };

  createFromFetch(
    fetch(location.pathname, {
      headers: {
        'x-rsc-tree': 'true',
      },
    }).then(handleRedirectResponse),
  ).then((content) => {
    const ModernRoot = createRoot();

    ${
      isNestedRouter
        ? `
        render(
          <ModernRoot rscPayload={Promise.resolve(content)}>
          </ModernRoot>,
          '${mountId}',
        );
      `
        : `
        render(
          <ModernRoot>
            <RscClientRoot rscPayload={Promise.resolve(content)} />
          </ModernRoot>,
          '${mountId}',
        );
      `
    }

  })
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
  isNestedRouter,
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
  isNestedRouter?: boolean;
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
  isNestedRouter,
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
    return `import modernRuntime from '${internalSrcAlias}/${runtimeConfigFile}';
const runtimeConfig = typeof modernRuntime === 'function' ? modernRuntime(getCurrentEntryName()) : modernRuntime`;
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
  runtimePlugins: RuntimePluginConfig[];
}) => `import { registerPlugin, mergeConfig } from '@${metaName}/runtime/plugin';
import { getGlobalAppConfig, getGlobalLayoutApp, getCurrentEntryName } from '@${metaName}/runtime/context';

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
  entryName,
  srcDirectory,
  internalSrcAlias,
  metaName,
  entry,
  customEntry,
}: {
  entryName: string;
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

const entryName = '${entryName}';
setGlobalContext({
  entryName,
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
            .replace(/entry\.[tj]sx/, 'App')
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
