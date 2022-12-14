import path from 'path';
import type {
  Entrypoint,
  NestedRoute,
  PageRoute,
  Route,
  RouteLegacy,
} from '@modern-js/types';
import { fs } from '@modern-js/utils';
import type { RuntimePlugin } from '../types';
import { TEMP_LOADERS_DIR } from './constants';

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
}) => `
  AppWrapper = createApp({
    plugins: [
     ${plugins
       .map(
         ({ name, options, args }) =>
           `${name}({...${options}, ...App?.config?.${args || name}}),`,
       )
       .join('\n')}
    ]
  })(${fileSystemRoutes ? '' : `App`})

  if (IS_BROWSER) {
    ${
      customBootstrap
        ? `customBootstrap(AppWrapper);`
        : `bootstrap(AppWrapper, MOUNT_ID, root, ReactDOM);`
    }
  }

  return AppWrapper
`;

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

  <script>
    window.__assetPrefix__ = '<%= assetPrefix %>';
  </script>
  ${partials.head.join('\n')}

  <!--<?- chunksMap.css ?>-->
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
  internalDirectory,
  entryName,
}: {
  routes: (NestedRoute | PageRoute)[];
  internalDirectory: string;
  entryName: string;
}) => {
  const loaders: string[] = [];
  const loaderIndexFile = path.join(
    internalDirectory,
    entryName,
    TEMP_LOADERS_DIR,
    'index.js',
  );
  const traverseRouteTree = (route: NestedRoute | PageRoute): Route => {
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
        /"(loader_[^"])"/g,
        '$1',
      )},`;
    } else {
      routesCode += `${JSON.stringify(route, null, 2)}`;
    }
  }
  routesCode += `\n];`;
  let importLoadersCode = '';
  if (loaders.length > 0) {
    importLoadersCode = `
    import { ${loaders.map(
      (loader, index) => `loader_${index}`,
    )} } from "${loaderIndexFile.replace(/\\/g, '/')}"`;
  }

  return `
    ${importLoadersCode}
    ${routesCode}
  `;
};

export const fileSystemRoutes = async ({
  routes,
  ssrMode,
  nestedRoutesEntry,
  entryName,
  internalDirectory,
  internalDirAlias,
}: {
  routes: RouteLegacy[] | (NestedRoute | PageRoute)[];
  ssrMode: 'string' | 'stream' | false;
  nestedRoutesEntry?: string;
  entryName: string;
  internalDirectory: string;
  internalDirAlias: string;
}) => {
  const loadings: string[] = [];
  const errors: string[] = [];
  const loaders: string[] = [];
  const loadersMap: Record<string, string> = {};
  const loadersIndexFile = path.join(
    internalDirAlias,
    entryName,
    TEMP_LOADERS_DIR,
    'index.js',
  );

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
  let dataLoaderPath = '';
  let componentLoaderPath = '';
  if (ssrMode) {
    dataLoaderPath = require.resolve(`@modern-js/plugin-data-loader/loader`);
    if (nestedRoutesEntry) {
      dataLoaderPath = `${dataLoaderPath}?routesDir=${nestedRoutesEntry}&mapFile=${loadersMapFile}!`;
    }
    componentLoaderPath = `${path.join(
      __dirname,
      '../builder/loaders/routerLoader',
    )}!`;
  }

  const traverseRouteTree = (route: NestedRoute | PageRoute): Route => {
    let children: Route['children'];
    if ('children' in route && route.children) {
      children = route?.children?.map(traverseRouteTree);
    }
    let loading: string | undefined;
    let error: string | undefined;
    let loader: string | undefined;
    let component = '';

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
        loadersMap[loader] = route.id!;
      }

      if (route._component) {
        if (route.isRoot) {
          rootLayoutCode = `import RootLayout from '${route._component}'`;
          component = `RootLayout`;
        } else if (ssrMode === 'string') {
          component = `loadable(() => import(/* webpackChunkName: "${route.id}" */  '${componentLoaderPath}${route._component}'))`;
        } else {
          // csr and streaming
          component = `lazy(() => import(/* webpackChunkName: "${route.id}" */  '${componentLoaderPath}${route._component}'))`;
        }
      }
    } else if (route._component) {
      component = `loadable(() => import('${route._component}'))`;
    }

    const finalRoute = {
      ...route,
      loading,
      loader,
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
      routeComponentsCode += `${JSON.stringify(newRoute, null, 2)
        .replace(/"(loadable.*\))"/g, '$1')
        .replace(/"(loadableLazy.*\))"/g, '$1')
        .replace(/"(lazy.*\))"/g, '$1')
        .replace(/"(loading_[^"])"/g, '$1')
        .replace(/"(loader_[^"])"/g, '$1')
        .replace(/"(RootLayout)"/g, '$1')
        .replace(/"(error_[^"])"/g, '$1')
        .replace(/\\"/g, '"')},`;
    } else {
      const component = `loadable(() => import('${route._component}'))`;
      const finalRoute = {
        ...route,
        component,
      };

      routeComponentsCode += `${JSON.stringify(finalRoute, null, 2)
        .replace(/"(loadable[^"]*)"/g, '$1')
        .replace(/"(lazy[^"]*)"/g, '$1')},`;
    }
  }
  routeComponentsCode += `\n];`;

  const importLoadingCode = loadings
    .map((loading, index) => {
      return `import loading_${index} from '${loading}';\n`;
    })
    .join('');

  const importErrorComponentsCode = errors
    .map((error, index) => {
      return `import error_${index} from '${error}';\n`;
    })
    .join('');

  let importLoadersCode = '';

  if (loaders.length > 0) {
    importLoadersCode = `
    import { ${loaders.map(
      (loader, index) => `loader_${index}`,
    )} } from "${dataLoaderPath}${loadersIndexFile.replace(/\\/g, '/')}"
  `;

    const loaderEntryCode = loaders
      .map((loader, index) => {
        return `export * from './loader_${index}.js';`;
      })
      .join('\n');

    const loaderEntryFile = path.join(
      internalDirectory,
      entryName,
      TEMP_LOADERS_DIR,
      'entry.js',
    );

    await fs.ensureFile(loaderEntryFile);
    await fs.writeFile(loaderEntryFile, loaderEntryCode);
    await fs.writeJSON(loadersMapFile, loadersMap);

    await Promise.all(
      loaders.map(async (loader, index) => {
        const name = `loader_${index}`;
        const filename = path.join(
          internalDirectory,
          entryName,
          TEMP_LOADERS_DIR,
          `${name}.js`,
        );
        const code = `
          export { loader as ${name} } from '${loader.replace(/\\/g, '/')}'
        `;
        await fs.ensureFile(filename);
        await fs.writeFile(filename, code);
      }),
    );
  }

  return `
    ${importLazyCode}
    ${rootLayoutCode}
    ${importLoadingCode}
    ${importErrorComponentsCode}
    ${importLoadersCode}
    ${routeComponentsCode}
  `;
};
