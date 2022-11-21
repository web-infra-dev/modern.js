import type { RuntimePlugin } from '@modern-js/core';
import type {
  Entrypoint,
  NestedRoute,
  PageRoute,
  Route,
  RouteLegacy,
} from '@modern-js/types';

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
  alias,
}: {
  routes: (NestedRoute | PageRoute)[];
  alias: {
    name: string;
    basename: string;
  };
}) => {
  const { name, basename } = alias;
  const loaders: string[] = [];
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
  const importLoadersCode = loaders
    .map((loader, index) => {
      const realLoaderPath = loader.replace(name, basename);
      return `import loader_${index} from '${realLoaderPath}';\n`;
    })
    .join('');

  return `
    ${importLoadersCode}
    ${routesCode}
  `;
};

export const fileSystemRoutes = ({
  routes,
  ssrMode,
  nestedRoutesEntry,
  entryName,
}: {
  routes: RouteLegacy[] | (NestedRoute | PageRoute)[];
  ssrMode: 'string' | 'stream' | false;
  nestedRoutesEntry?: string;
  entryName: string;
}) => {
  // The legacy mode and pages dir routes should use loadable
  // nested routes + renderTostring should use loadable.lazy
  // nested routes + renderToStream should use react.lazy
  const importLazyCode = `
    import { lazy } from "react";
    import loadable, { lazy as loadableLazy } from "@modern-js/runtime/loadable"
  `;
  let dataLoaderPath = '';
  if (ssrMode) {
    dataLoaderPath = require.resolve(`@modern-js/plugin-data-loader/loader`);
    if (nestedRoutesEntry) {
      dataLoaderPath = `${dataLoaderPath}?routesDir=${nestedRoutesEntry}&entryName=${entryName}!`;
    }
  }

  const loadings: string[] = [];
  const errors: string[] = [];
  const loaders: string[] = [];

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
        loader = `loader_${loaders.length - 1}`;
      }

      if (route._component) {
        if (ssrMode === 'stream') {
          component = `lazy(() => import(/* webpackChunkName: "${route.id}" */  /* webpackMode: "lazy-once" */ '${route._component}'))`;
        } else {
          component = `loadableLazy(() => import(/* webpackChunkName: "${route.id}" */  /* webpackMode: "lazy-once" */ '${route._component}'))`;
        }
      }
    } else if (route._component) {
      component = `loadableLazy(() => import('${route._component}'))`;
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

  const importLoaderComponentsCode = loaders
    .map((loader, index) => {
      return `import loader_${index} from '${dataLoaderPath}${loader}';\n`;
    })
    .join('');

  return `
    ${importLazyCode}
    ${importLoadingCode}
    ${importErrorComponentsCode}
    ${importLoaderComponentsCode}
    ${routeComponentsCode}
  `;
};
