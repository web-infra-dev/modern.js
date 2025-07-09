import path from 'path';
import type {
  AppNormalizedConfig,
  AppToolsContext,
} from '@modern-js/app-tools';
import type {
  Entrypoint,
  NestedRouteForCli,
  PageRoute,
  Route,
  RouteLegacy,
  SSRMode,
} from '@modern-js/types';
import {
  fs,
  findExists,
  formatImportPath,
  getEntryOptions,
  isSSGEntry,
  slash,
} from '@modern-js/utils';
import { ROUTE_MODULES } from '@modern-js/utils/universal/constants';
import {
  APP_CONFIG_NAME,
  APP_INIT_EXPORTED,
  TEMP_LOADERS_DIR,
} from '../constants';
import {
  getPathWithoutExt,
  getServerLoadersFile,
  parseModule,
  replaceWithAlias,
} from './utils';

export const routesForServer = ({
  routesForServerLoaderMatches,
}: {
  routesForServerLoaderMatches: (NestedRouteForCli | PageRoute)[];
}) => {
  const loaders: string[] = [];
  const actions: string[] = [];
  const loadersMap: Record<
    string,
    {
      routeId: string;
      loaderId: number;
      filePath: string;
      clientData?: boolean;
      inline: boolean;
      route: NestedRouteForCli;
    }
  > = {};
  const traverseRouteTree = (route: NestedRouteForCli | PageRoute): Route => {
    let children: Route['children'];
    if ('children' in route && route.children) {
      children = route?.children?.map(traverseRouteTree);
    }
    let loader: string | undefined;
    let action: string | undefined;

    if (route.type === 'nested') {
      if (route.loader || route.data) {
        loaders.push(route.loader);
        const loaderId = loaders.length - 1;
        loader = `loader_${loaderId}`;
        const inline = Boolean(route.data);
        loadersMap[loader] = {
          loaderId,
          routeId: route.id!,
          filePath: route.data || route.loader,
          clientData: Boolean(route.clientData),
          route,
          inline,
        };
        if (route.action) {
          actions.push(route.action);
          action = `action_${loaders.length - 1}`;
        }
      }
    }

    const finalRoute = {
      ...route,
      loader,
      action,
      children,
    };
    return finalRoute;
  };

  let routesCode = `
  export const routes = [
  `;
  for (const route of routesForServerLoaderMatches) {
    if ('type' in route) {
      const keywords = ['loader', 'action'];
      const regs = keywords.map(createMatchReg);
      const newRoute = traverseRouteTree(route);
      const routeStr = JSON.stringify(newRoute, null, 2);
      routesCode += regs
        .reduce((acc, reg) => acc.replace(reg, '$1$2'), routeStr)
        .replace(/\\"/g, '"');
    } else {
      routesCode += `${JSON.stringify(route, null, 2)}`;
    }
  }
  routesCode += `\n];`;
  let importLoadersCode = '';
  for (const [key, loaderInfo] of Object.entries(loadersMap)) {
    if (loaderInfo.inline) {
      const { route } = loaderInfo;
      if (route.action) {
        importLoadersCode += `import { loader as ${key}, action as action_${
          loaderInfo.loaderId
        } } from "${slash(loaderInfo.filePath)}";\n`;
      } else {
        importLoadersCode += `import { loader as ${key} } from "${slash(
          loaderInfo.filePath,
        )}";\n`;
      }
    } else {
      importLoadersCode += `import ${key} from "${slash(
        loaderInfo.filePath,
      )}";\n`;
    }
  }

  return `
    ${importLoadersCode}
    ${routesCode}
  `;
};

const createMatchReg = (keyword: string) =>
  new RegExp(`("${keyword}":\\s)"([^\n]+)"`, 'g');

export const fileSystemRoutes = async ({
  metaName,
  routes,
  ssrMode,
  nestedRoutesEntry,
  entryName,
  internalDirectory,
  splitRouteChunks = true,
  isRscClient = false,
}: {
  metaName: string;
  routes: RouteLegacy[] | (NestedRouteForCli | PageRoute)[];
  ssrMode?: SSRMode;
  nestedRoutesEntry?: string;
  entryName: string;
  internalDirectory: string;
  splitRouteChunks?: boolean;
  isRscClient?: boolean;
}) => {
  const components: string[] = [];
  const loadings: string[] = [];
  const errors: string[] = [];
  const loaders: string[] = [];
  const loadersMap: Record<
    string,
    {
      routeId: string;
      loaderId: number;
      filePath: string;
      inValidSSRRoute?: boolean;
      clientData?: boolean;
      inline: boolean;
      route: NestedRouteForCli;
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
    import loadable, { lazy as loadableLazy } from "@${metaName}/runtime/loadable"
  `;

  let rootLayoutCode = ``;
  const getDataLoaderPath = ({
    loaderId,
    clientData,
    action,
    inline,
    routeId,
    inValidSSRRoute,
  }: {
    loaderId: string;
    clientData?: boolean;
    action: string | false;
    inline: boolean;
    routeId: string;
    inValidSSRRoute?: boolean;
  }) => {
    if (!ssrMode) {
      return '';
    }

    const clientDataStr = clientData ? `&clientData=${clientData}` : '';
    const retain = inValidSSRRoute ?? false;
    if (nestedRoutesEntry) {
      return `?loaderId=${loaderId}${clientDataStr}&action=${
        action ? slash(action) : action
      }&inline=${inline}&routeId=${routeId}&retain=${retain}`;
    }
    return '';
  };

  const createLazyImport = ({
    componentPath,
    routeId,
    webpackChunkName,
    eager,
  }: {
    componentPath: string;
    routeId?: string;
    webpackChunkName?: boolean;
    eager?: boolean;
  }) => {
    const importOptions = webpackChunkName
      ? `/* webpackChunkName: "${routeId}" */  `
      : eager
        ? `/* webpackMode: "eager" */  `
        : '';

    return `() => import(${importOptions}'${componentPath}').then(routeModule => handleRouteModule(routeModule, "${routeId}")).catch(handleRouteModuleError)`;
  };

  const traverseRouteTree = (
    route: NestedRouteForCli | PageRoute,
    isRscClient: boolean,
  ): Route => {
    let children: Route['children'];
    if ('children' in route && route.children) {
      children = route?.children?.map(child =>
        traverseRouteTree(child, isRscClient),
      );
    }
    let loading: string | undefined;
    let error: string | undefined;
    let loader: string | undefined;
    let action: string | undefined;
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
      if (route.loader || route.data) {
        loaders.push(route.loader);
        const loaderId = loaders.length - 1;
        loader = `loader_${loaderId}`;
        const inline = Boolean(route.data);
        loadersMap[loader] = {
          loaderId,
          routeId: route.id!,
          inValidSSRRoute: route.inValidSSRRoute,
          filePath: route.data || route.loader,
          clientData: Boolean(route.clientData),
          route,
          inline,
        };
        loader = `loader_${loaderId}`;
        if (route.action) {
          action = `action_${loaderId}`;
        }
      }
      if (typeof route.config === 'string') {
        configs.push(route.config);
        const configId = configs.length - 1;
        config = `config_${configId}`;
        configsMap[config] = route.config;
      }

      if (route._component) {
        if (route.isRoot) {
          lazyImport = createLazyImport({
            componentPath: route._component,
            routeId: route.id,
          });
          rootLayoutCode = `import RootLayout from '${route._component}'`;
          component = 'RootLayout';
        } else if (splitRouteChunks) {
          lazyImport = createLazyImport({
            componentPath: route._component,
            routeId: route.id,
            webpackChunkName: true,
          });
          // csr and streaming ssr use lazy
          component =
            ssrMode === 'string'
              ? `loadable(${lazyImport})`
              : `lazy(${lazyImport})`;
        } else {
          if (ssrMode === 'string') {
            components.push(route._component);
            component = `component_${components.length - 1}`;
          } else {
            lazyImport = createLazyImport({
              componentPath: route._component,
              routeId: route.id,
              eager: true,
            });
            component = `lazy(${lazyImport})`;
          }
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

    const finalRoute: any = {
      ...route,
      loading,
      loader,
      action,
      config,
      error,
      children,
    };
    if (!isRscClient) {
      finalRoute.lazyImport = lazyImport;
    }
    if (route._component && !isRscClient) {
      finalRoute.component = component;
    }
    /**
     * All routing components with loader will add shouldRevalidate
     * but when routeModule does not have a corresponding shouldRevalidate
     * the default shouldRevalidate will be used.
     */
    if (
      route.type === 'nested' &&
      route._component &&
      (route.loader || route.data)
    ) {
      finalRoute.shouldRevalidate = `createShouldRevalidate("${route.id}")`;
    }
    return finalRoute;
  };

  let routeComponentsCode = `
    export const routes = [
  `;
  for (const route of routes) {
    if ('type' in route) {
      const newRoute = traverseRouteTree(route, isRscClient);
      const routeStr = JSON.stringify(newRoute, null, 2);
      const keywords = [
        'component',
        'lazyImport',
        'shouldRevalidate',
        'loader',
        'action',
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
      const { route } = loaderInfo;
      if (route.action) {
        importLoadersCode += `import { loader as ${key}, action as action_${
          loaderInfo.loaderId
        } } from "${slash(loaderInfo.filePath)}${getDataLoaderPath({
          loaderId: key,
          clientData: loaderInfo.clientData,
          action: route.action,
          inline: loaderInfo.inline,
          routeId: loaderInfo.routeId,
          inValidSSRRoute: loaderInfo.inValidSSRRoute,
        })}";\n`;
      } else {
        importLoadersCode += `import { loader as ${key} } from "${slash(
          loaderInfo.filePath,
        )}${getDataLoaderPath({
          loaderId: key,
          clientData: loaderInfo.clientData,
          action: false,
          inline: loaderInfo.inline,
          routeId: route.id!,
          inValidSSRRoute: loaderInfo.inValidSSRRoute,
        })}";\n`;
      }
    } else {
      importLoadersCode += `import ${key} from "${slash(
        loaderInfo.filePath,
      )}${getDataLoaderPath({
        loaderId: key,
        clientData: loaderInfo.clientData,
        action: false,
        inline: loaderInfo.inline,
        routeId: loaderInfo.routeId,
        inValidSSRRoute: loaderInfo.inValidSSRRoute,
      })}";\n`;
    }
  }

  let importConfigsCode = '';

  for (const [key, configPath] of Object.entries(configsMap)) {
    importConfigsCode += `import * as ${key} from "${slash(configPath)}";\n`;
  }

  await fs.ensureFile(loadersMapFile);
  await fs.writeJSON(loadersMapFile, loadersMap);

  const importRuntimeRouterCode = `
    import { createShouldRevalidate, handleRouteModule,  handleRouteModuleError} from '@${metaName}/runtime/router';
  `;
  const routeModulesCode = `
    if(typeof document !== 'undefined'){
      window.${ROUTE_MODULES} = {}
    }
  `;

  return `
    ${importLazyCode}
    ${!isRscClient ? importComponentsCode : ''}
    ${importRuntimeRouterCode}
    ${!isRscClient ? rootLayoutCode : ''}
    ${importLoadingCode}
    ${importErrorComponentsCode}
    ${importLoadersCode}
    ${importConfigsCode}
    ${routeModulesCode}
    ${routeComponentsCode}
  `;
};

export function ssrLoaderCombinedModule(
  entrypoints: Entrypoint[],
  entrypoint: Entrypoint,
  config: AppNormalizedConfig<'shared'>,
  appContext: AppToolsContext<'shared'>,
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

    if (!config.source.enableAsyncEntry) {
      return combinedModule;
    }

    return `
    async function loadModules() {
      const [moduleA, moduleB] = await Promise.all([
        import("${slash(serverLoaderRuntime)}"),
        import("${slash(serverLoadersFile)}")
      ]);

      return {
        ...moduleA,
        ...moduleB
      };
    }

    export { loadModules };
    `;
  }
  return null;
}

export const runtimeGlobalContext = async ({
  entryName,
  metaName,
  srcDirectory,
  nestedRoutesEntry,
  internalSrcAlias,
  globalApp,
  rscType = false,
}: {
  entryName: string;
  metaName: string;
  srcDirectory: string;
  nestedRoutesEntry?: string;
  internalSrcAlias: string;
  globalApp?: string | false;
  rscType?: 'server' | 'client' | false;
}) => {
  const imports = [
    `import { setGlobalContext } from '@${metaName}/runtime/context';`,
  ];
  if (nestedRoutesEntry) {
    const rootLayoutPath = path.join(nestedRoutesEntry, 'layout');
    const rootLayoutFile = findExists(
      ['.js', '.ts', '.jsx', '.tsx'].map(ext => `${rootLayoutPath}${ext}`),
    );
    if (rootLayoutFile) {
      const rootLayoutBuffer = await fs.readFile(rootLayoutFile);
      const rootLayout = rootLayoutBuffer.toString();
      const [, moduleExports] = await parseModule({
        source: rootLayout.toString(),
        filename: rootLayoutFile,
      });
      const hasAppConfig = moduleExports.some(e => e.n === APP_CONFIG_NAME);
      const hasAppInit = moduleExports.some(e => e.n === APP_INIT_EXPORTED);
      const layoutPath = formatImportPath(
        getPathWithoutExt(
          replaceWithAlias(srcDirectory, rootLayoutFile, internalSrcAlias),
        ),
      );
      if (hasAppConfig) {
        imports.push(`import { config as appConfig } from '${layoutPath}';`);
      } else {
        imports.push(`let appConfig;`);
      }
      if (hasAppInit) {
        imports.push(`import { init as appInit } from '${layoutPath}';`);
      } else {
        imports.push(`let appInit;`);
      }
    } else {
      imports.push(`let appConfig;`);
      imports.push(`let appInit;`);
    }
  } else {
    imports.push(`let appConfig;`);
    imports.push(`let appInit;`);
  }

  if (globalApp) {
    imports.push(
      `import layoutApp from '${formatImportPath(
        globalApp.replace(srcDirectory, internalSrcAlias),
      )}';`,
    );
  } else {
    imports.push(`let layoutApp;`);
  }

  const isClient = rscType === 'client';
  const enableRsc = Boolean(rscType);

  if (isClient) {
    return `${imports.join('\n')}

    import { routes } from './routes';

    const entryName = '${entryName}';
      setGlobalContext({
        entryName,
        layoutApp,
        routes,
        appInit,
        appConfig,
        isRscClient: true,
        enableRsc: true,
      });
    `;
  } else {
    return `${imports.join('\n')}

    import { routes } from './routes';

    const entryName = '${entryName}';
      setGlobalContext({
        entryName,
        layoutApp,
        routes,
        appInit,
        appConfig,
        enableRsc: ${enableRsc},
      });
    `;
  }
};
