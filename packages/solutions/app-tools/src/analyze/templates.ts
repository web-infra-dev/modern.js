/* eslint-disable max-lines */
import path from 'path';
import type {
  Entrypoint,
  NestedRouteForCli,
  PageRoute,
  Route,
  RouteLegacy,
  SSRMode,
} from '@modern-js/types';
import { fs, getEntryOptions, isSSGEntry, slash } from '@modern-js/utils';
import type { AppNormalizedConfig, IAppContext, RuntimePlugin } from '../types';
import { APP_CONFIG_NAME, TEMP_LOADERS_DIR } from './constants';
import { getServerLoadersFile } from './utils';

export const index = ({
  mountId,
  imports,
  renderFunction,
  exportStatement,
}: {
  mountId: string;
  imports: string;
  exportStatement: string;
  renderFunction: string;
}) => `
const IS_BROWSER = typeof window !== 'undefined' && window.name !== 'nodejs';
const IS_REACT18 = process.env.IS_REACT18 === 'true';
const MOUNT_ID = '${mountId}';

${imports}

let AppWrapper = null;

let root = null;

function render() {
  ${renderFunction}
}

AppWrapper = render();

${exportStatement};
`;

export const renderFunction = ({
  plugins,
  customBootstrap,
  fileSystemRoutes,
}: {
  plugins: RuntimePlugin[];
  customBootstrap?: string | false;
  fileSystemRoutes: Entrypoint['fileSystemRoutes'];
}) => {
  const bootstrap = 'bootstrap(AppWrapper, MOUNT_ID, root, ReactDOM)';

  return `
  const finalAppConfig = {
    ...App.config,
    ...typeof ${APP_CONFIG_NAME} === 'function' ? ${APP_CONFIG_NAME}() : {},
  }

  AppWrapper = createApp({
    plugins: [
     ${plugins
       .map(
         ({ name, options, args }) =>
           `${name}({...${options}, ...finalAppConfig?.${args || name}}),`,
       )
       .join('\n')}
    ]
  })(${fileSystemRoutes ? '' : `App`})


  if(!AppWrapper.init && typeof appInit !== 'undefined') {
    AppWrapper.init = appInit;
  }


  if (IS_BROWSER) {
    ${
      customBootstrap
        ? `customBootstrap(AppWrapper, () => ${bootstrap});`
        : `${bootstrap};`
    }
  }

  return AppWrapper
`;
};

export const html = (partials: {
  top: string[];
  head: string[];
  body: string[];
}) => `
<!DOCTYPE html>
<html>
<head>
  <%= meta %>
  <title><%= title %></title>

  ${partials.top.join('\n')}

  ${partials.head.join('\n')}

</head>

<body>
  <noscript>
    We're sorry but react app doesn't work properly without JavaScript enabled. Please enable it to continue.
  </noscript>
  <div id="<%= mountId %>"><!--<?- html ?>--></div>
  ${partials.body.join('\n')}
  <!--<?- chunksMap.js ?>-->
  <!--<?- SSRDataScript ?>-->
  <!--<?- bottomTemplate ?>-->
</body>

</html>
`;

export const routesForServer = ({
  routes,
}: {
  routes: (NestedRouteForCli | PageRoute)[];
}) => {
  const loaders: string[] = [];
  const traverseRouteTree = (route: NestedRouteForCli | PageRoute): Route => {
    let children: Route['children'];
    if ('children' in route && route.children) {
      children = route?.children?.map(traverseRouteTree);
    }
    let loader: string | undefined;

    if (route.type === 'nested') {
      if (route.loader) {
        loaders.push(route.loader);
        loader = `loader_${loaders.length - 1}`;
      }
    }

    const finalRoute = {
      ...route,
      loader,
      children,
    };
    return finalRoute;
  };

  let routesCode = `
  export const routes = [
  `;
  for (const route of routes) {
    if ('type' in route) {
      const newRoute = traverseRouteTree(route);
      routesCode += `${JSON.stringify(newRoute, null, 2).replace(
        /"(loader_[^"]+)"/g,
        '$1',
      )},`;
    } else {
      routesCode += `${JSON.stringify(route, null, 2)}`;
    }
  }
  routesCode += `\n];`;
  let importLoadersCode = '';
  if (loaders.length > 0) {
    importLoadersCode = loaders
      .map((loader, index) => {
        return `import loader_${index} from "${slash(loader)}"`;
      })
      .join('\n');
  }

  return `
    ${importLoadersCode}
    ${routesCode}
  `;
};

const createMatchReg = (keyword: string) =>
  new RegExp(`("${keyword}":\\s)"([^,]+)"`, 'g');

export const fileSystemRoutes = async ({
  routes,
  ssrMode,
  nestedRoutesEntry,
  entryName,
  internalDirectory,
  splitRouteChunks = true,
}: {
  routes: RouteLegacy[] | (NestedRouteForCli | PageRoute)[];
  ssrMode?: SSRMode;
  nestedRoutesEntry?: string;
  entryName: string;
  internalDirectory: string;
  splitRouteChunks?: boolean;
}) => {
  const components: string[] = [];
  const loadings: string[] = [];
  const errors: string[] = [];
  const loaders: string[] = [];
  const loadersMap: Record<
    string,
    {
      routeId: string;
      filePath: string;
      inline: boolean;
    }
  > = {};
  const configs: string[] = [];
  const configsMap: Record<string, any> = {};

  const loadersMapFile = path.join(
    internalDirectory,
    entryName,
    TEMP_LOADERS_DIR,
    'map.json',
  );

  const importLazyCode = `
    import { lazy } from "react";
    import loadable, { lazy as loadableLazy } from "@modern-js/runtime/loadable"
  `;

  let rootLayoutCode = ``;
  const getDataLoaderPath = (loaderId: string) => {
    if (!ssrMode) {
      return '';
    }

    if (nestedRoutesEntry) {
      return `?mapFile=${slash(loadersMapFile)}&loaderId=${loaderId}`;
    }
    return '';
  };

  const traverseRouteTree = (route: NestedRouteForCli | PageRoute): Route => {
    let children: Route['children'];
    if ('children' in route && route.children) {
      children = route?.children?.map(traverseRouteTree);
    }
    let loading: string | undefined;
    let error: string | undefined;
    let loader: string | undefined;
    let config: string | undefined;
    let component = '';
    let lazyImport = null;

    if (route.type === 'nested') {
      if (route.loading) {
        loadings.push(route.loading);
        loading = `loading_${loadings.length - 1}`;
      }
      if (route.error) {
        errors.push(route.error);
        error = `error_${errors.length - 1}`;
      }
      if (route.loader) {
        loaders.push(route.loader);
        const loaderId = loaders.length - 1;
        loader = `loader_${loaderId}`;
        loadersMap[loader] = {
          routeId: route.id!,
          filePath: route.loader,
          inline: false,
        };
      }
      if (typeof route.config === 'string') {
        configs.push(route.config);
        const configId = configs.length - 1;
        config = `config_${configId}`;
        configsMap[config] = route.config;
      }

      if (route._component) {
        if (splitRouteChunks) {
          if (route.isRoot) {
            rootLayoutCode = `import RootLayout from '${route._component}'`;
            component = `RootLayout`;
          } else if (ssrMode === 'string') {
            lazyImport = `() => import(/* webpackChunkName: "${route.id}" */  '${route._component}')`;
            component = `loadable(${lazyImport})`;
          } else {
            // csr and streaming
            lazyImport = `() => import(/* webpackChunkName: "${route.id}" */  '${route._component}')`;
            component = `lazy(${lazyImport})`;
          }
        } else {
          components.push(route._component);
          component = `component_${components.length - 1}`;
        }
      }
    } else if (route._component) {
      if (splitRouteChunks) {
        lazyImport = `() => import('${route._component}')`;
        component = `loadable(${lazyImport})`;
      } else {
        components.push(route._component);
        component = `component_${components.length - 1}`;
      }
    }

    const finalRoute = {
      ...route,
      lazyImport,
      loading,
      loader,
      config,
      error,
      children,
    };
    if (route._component) {
      finalRoute.component = component;
    }
    return finalRoute;
  };

  let routeComponentsCode = `
    export const routes = [
  `;
  for (const route of routes) {
    if ('type' in route) {
      const newRoute = traverseRouteTree(route);
      const routeStr = JSON.stringify(newRoute, null, 2);
      const keywords = [
        'component',
        'lazyImport',
        'loader',
        'loading',
        'error',
        'config',
      ];
      const regs = keywords.map(createMatchReg);
      const newRouteStr = regs
        .reduce((acc, reg) => acc.replace(reg, '$1$2'), routeStr)
        .replace(/"(RootLayout)"/g, '$1')
        .replace(/\\"/g, '"');
      routeComponentsCode += `${newRouteStr},`;
    } else {
      const component = `loadable(() => import('${route._component}'))`;
      const finalRoute = {
        ...route,
        component,
      };
      const keywords = ['component', 'lazyImport'];
      const routeStr = JSON.stringify(finalRoute, null, 2);
      const regs = keywords.map(createMatchReg);
      const newRouteStr = regs
        .reduce((acc, reg) => acc.replace(reg, '$1$2'), routeStr)
        .replace(/\\"/g, '"');
      routeComponentsCode += `${newRouteStr},`;
    }
  }
  routeComponentsCode += `\n];`;

  const importLoadingCode = loadings
    .map((loading, index) => {
      return `import loading_${index} from '${loading}';\n`;
    })
    .join('');

  const importComponentsCode = components
    .map((component, index) => {
      return `import component_${index} from '${component}';\n`;
    })
    .join('');

  const importErrorComponentsCode = errors
    .map((error, index) => {
      return `import error_${index} from '${error}';\n`;
    })
    .join('');

  let importLoadersCode = '';

  for (const [key, loaderInfo] of Object.entries(loadersMap)) {
    if (loaderInfo.inline) {
      importLoadersCode += `import { loader as ${key} } from "${slash(
        loaderInfo.filePath,
      )}${getDataLoaderPath(key)}";\n`;
    } else {
      importLoadersCode += `import ${key} from "${slash(
        loaderInfo.filePath,
      )}${getDataLoaderPath(key)}";\n`;
    }
  }

  let importConfigsCode = '';

  for (const [key, configPath] of Object.entries(configsMap)) {
    importConfigsCode += `import * as ${key} from "${slash(configPath)}";\n`;
  }

  await fs.ensureFile(loadersMapFile);
  await fs.writeJSON(loadersMapFile, loadersMap);

  return `
    ${importLazyCode}
    ${importComponentsCode}
    ${rootLayoutCode}
    ${importLoadingCode}
    ${importErrorComponentsCode}
    ${importLoadersCode}
    ${importConfigsCode}
    ${routeComponentsCode}
  `;
};

export function ssrLoaderCombinedModule(
  entrypoints: Entrypoint[],
  entrypoint: Entrypoint,
  config: AppNormalizedConfig<'shared'>,
  appContext: IAppContext,
) {
  const { entryName, isMainEntry } = entrypoint;
  const { packageName, internalDirectory } = appContext;

  const ssr = getEntryOptions(
    entryName,
    isMainEntry,
    config.server.ssr,
    config.server.ssrByEntries,
    packageName,
  );

  const ssg = isSSGEntry(config, entryName, entrypoints);
  if (entrypoint.nestedRoutesEntry && (ssr || ssg)) {
    const serverLoaderRuntime = require.resolve(
      '@modern-js/plugin-data-loader/runtime',
    );
    const serverLoadersFile = getServerLoadersFile(
      internalDirectory,
      entryName,
    );

    const combinedModule = `export * from "${slash(
      serverLoaderRuntime,
    )}"; export * from "${slash(serverLoadersFile)}"`;
    return combinedModule;
  }
  return null;
}
/* eslint-enable max-lines */
