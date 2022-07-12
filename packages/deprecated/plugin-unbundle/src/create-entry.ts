import path from 'path';
import {
  fs,
  isFastRefresh,
  createDebugger,
  isTypescript,
  readTsConfig,
  generateMetaTags,
  getEntryOptions,
} from '@modern-js/utils';
import { template } from '@modern-js/utils/lodash';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import type { Entrypoint } from '@modern-js/types';
import { DEV_CLIENT_PATH_ALIAS, DEV_CLIENT_URL } from './constants';

const debug = createDebugger('esm:create-entry');

export interface BaseTemplateVariables {
  meta: string;
  title: string;
  assetPrefix: string;
  mountId: string;
  [param: string]: string;
}

export interface TemplateVariables extends BaseTemplateVariables {
  topTemplate: string;
  headTemplate: string;
  bodyTemplate: string;
}

export interface TemplatesMap {
  index: boolean | string;
  top: boolean | string;
  head: boolean | string;
  body: boolean | string;
  bottom: boolean | string;
}

// inject entry js script and react fast refresh runtime code and error-overlay client
const injectScripts = (
  entrypoint: Entrypoint,
  appDirectory: string,
): string => {
  const pathname = path.relative(appDirectory, entrypoint.entry);

  debug(`inject-scripts src: ${pathname}`);

  const scripts = [
    `<script type="module" src="/${pathname}"></script>`,
    `<script type="module" src="/${DEV_CLIENT_PATH_ALIAS}/error-overlay.js"></script>\n<script type="module" src="${DEV_CLIENT_URL}"></script>`,
  ];

  if (isFastRefresh()) {
    const reactFreshEntry = path.dirname(
      require.resolve('react-refresh/package.json'),
    );
    const runtimePath = path.join(
      reactFreshEntry,
      'cjs/react-refresh-runtime.development.js',
    );

    const reactRefreshCode = fs
      .readFileSync(runtimePath, { encoding: 'utf-8' })
      .replace(`process.env.NODE_ENV`, JSON.stringify('development'));

    scripts.push(`<script>
    function debounce(e,t){let u;return()=>{clearTimeout(u),u=setTimeout(e,t)}}
    {
      const exports = {};
      ${reactRefreshCode}
      exports.performReactRefresh = debounce(exports.performReactRefresh, 30);
      window.$RefreshRuntime$ = exports;
      window.$RefreshRuntime$.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
    }
  </script>`);
  }

  return scripts.join('\n');
};

// provide process/module global variable
// TODO: should take better strategy
export const injectEnv = (userConfig: NormalizedConfig): string => {
  // inject globalVars
  let {
    source: { globalVars },
  } = userConfig;

  globalVars = globalVars || {};

  const globalVarKeys = Object.keys(globalVars);

  let globalVarStr = ``;

  globalVarKeys.forEach(key => {
    globalVarStr += `window.${key}=${JSON.stringify(globalVars![key])}\n`;
  });

  const processStr = `window.process={env: { NODE_ENV: 'development'}};;`;
  const moduleStr = `window.module={};`;

  return `<script>
${processStr}
${moduleStr}
${globalVarStr}
</script>
`;
};

// inject const enum value to global object
const injectConstEnums = (appDirectory: string): string => {
  if (isTypescript(appDirectory)) {
    // read tsconfig.json
    const tsconfigJSON = readTsConfig(appDirectory);

    // .d.ts files which need to be
    const ts = require('typescript');
    const {
      raw: { include },
    } = ts.parseJsonConfigFileContent(tsconfigJSON, ts.sys, appDirectory);

    if (include?.length) {
      const { parseDTS } = require('./parse-dts');
      const enums = parseDTS(
        include
          .filter((file: string) => path.extname(file))
          .map((file: string) => path.resolve(appDirectory, file)),
      );

      return `<script>${Object.keys(enums)
        .map((key: string) => `window.${key}=${JSON.stringify(enums[key])};`)
        .join('\n')}</script>`;
    }
  }

  return '';
};

const renderTemplate = (
  filepath: string,
  variables: TemplateVariables | BaseTemplateVariables,
) => {
  const content = fs.readFileSync(filepath, 'utf8');

  return template(content)(variables);
};

const initTemplateVariables = (
  appContext: IAppContext,
  userConfig: NormalizedConfig,
  entryName: string,
): BaseTemplateVariables => {
  const {
    output: {
      title,
      titleByEntries,
      meta,
      metaByEntries,
      templateParameters,
      templateParametersByEntries,
      mountId,
      assetPrefix,
    },
  } = userConfig;

  const { packageName } = appContext;

  const titleVariable = getEntryOptions(
    entryName,
    title,
    titleByEntries,
    packageName,
  );

  const metaVariable = generateMetaTags(
    getEntryOptions(entryName, meta, metaByEntries, packageName),
  );

  return {
    assetPrefix: assetPrefix || '/',
    title: titleVariable!,
    meta: metaVariable,
    mountId: mountId!,
    // TODO: favicon
    ...getEntryOptions<Record<string, unknown> | undefined>(
      entryName,
      templateParameters,
      templateParametersByEntries,
      packageName,
    ),
  };
};

const createEntryHtml = (
  appContext: IAppContext,
  userConfig: NormalizedConfig,
  entryName: string,
) => {
  const templateVariables = initTemplateVariables(
    appContext,
    userConfig,
    entryName,
  );

  const template = appContext.htmlTemplates[entryName];

  const output = renderTemplate(template, { ...templateVariables });

  fs.outputFileSync(template, output);
};

export const createHtml = (
  userConfig: NormalizedConfig,
  appContext: IAppContext,
) => {
  appContext.entrypoints.forEach(({ entryName }) => {
    createEntryHtml(appContext, userConfig, entryName);
  });
};

export const createHtmlPartials = (
  entrypoint: Entrypoint,
  appContext: IAppContext,
  config: NormalizedConfig,
) =>
  [
    injectScripts(entrypoint, appContext.appDirectory),
    injectEnv(config),
    injectConstEnums(appContext.appDirectory),
  ].join('\n');
