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
import { ROUTE_MODULES } from '@modern-js/utils/universal/constants';
import type { AppNormalizedConfig, IAppContext } from '@modern-js/app-tools';
import { TEMP_LOADERS_DIR } from '../constants';
import { getServerLoadersFile } from './utils';

export const routesForServer = ({
  routes,
}: {
  routes: (NestedRouteForCli | PageRoute)[];
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
  for (const route of routes) {
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
      loaderId: number;
      filePath: string;
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
    import loadable, { lazy as loadableLazy } from "@modern-js/runtime/loadable"
  `;

  let rootLayoutCode = ``;
  const getDataLoaderPath = ({
    loaderId,
    clientData,
    action,
    inline,
    routeId,
  }: {
    loaderId: string;
    clientData?: boolean;
    action: string | false;
    inline: boolean;
    routeId: string;
  }) => {
    if (!ssrMode) {
      return '';
    }

    const clientDataStr = clientData ? `&clientData=${clientData}` : '';
    if (nestedRoutesEntry) {
      return `?loaderId=${loaderId}${clientDataStr}&action=${
        action ? slash(action) : action
      }&inline=${inline}&routeId=${routeId}`;
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
        if (splitRouteChunks) {
          if (route.isRoot) {
            lazyImport = `() => import('${route._component}').then(routeModule => handleRouteModule(routeModule, "${route.id}")).catch(handleRouteModuleError) `;
            rootLayoutCode = `import RootLayout from '${route._component}'`;
            component = `RootLayout`;
          } else if (ssrMode === 'string') {
            lazyImport = `() => import(/* webpackChunkName: "${route.id}" */  '${route._component}').then(routeModule => handleRouteModule(routeModule, "${route.id}")).catch(handleRouteModuleError) `;
            component = `loadable(${lazyImport})`;
          } else {
            // csr and streaming
            lazyImport = `() => import(/* webpackChunkName: "${route.id}" */  '${route._component}').then(routeModule => handleRouteModule(routeModule, "${route.id}")).catch(handleRouteModuleError) `;
            component = `lazy(${lazyImport})`;
          }
        } else if (ssrMode === 'string') {
          components.push(route._component);
          component = `component_${components.length - 1}`;
        } else {
          lazyImport = `() => import(/* webpackMode: "eager" */  '${route._component}').then(routeModule => handleRouteModule(routeModule, "${route.id}")).catch(handleRouteModuleError) `;
          component = `lazy(${lazyImport})`;
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
      action,
      config,
      error,
      children,
    };
    if (route._component) {
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
      const newRoute = traverseRouteTree(route);
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
    import { createShouldRevalidate, handleRouteModule,  handleRouteModuleError} from '@modern-js/runtime/router';
  `;
  const routeModulesCode = `
    if(typeof document !== 'undefined'){
      window.${ROUTE_MODULES} = {}
    }
  `;

  return `
    ${importLazyCode}
    ${importComponentsCode}
    ${importRuntimeRouterCode}
    ${rootLayoutCode}
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

export const runtimeGlobalContext = ({ metaName }: { metaName: string }) => {
  return `import { setGlobalContext } from '@${metaName}/runtime/context'

import { routes } from './routes.js';

setGlobalContext({
  routes,
});`;
};
/* eslint-enable max-lines */
