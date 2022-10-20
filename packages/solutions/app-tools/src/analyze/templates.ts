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

const traverseRouteTree = (route: NestedRoute | PageRoute): Route => {
  let children: Route['children'];
  if ('children' in route && route.children) {
    children = route?.children?.map(traverseRouteTree);
  }
  const finalRoute = {
    ...route,
    children,
  };
  if (route._component) {
    const component = `loadable(() => import('${route._component}'))`;
    finalRoute.component = component;
  }
  return finalRoute;
};

export const fileSystemRoutes = ({
  routes,
}: {
  routes: RouteLegacy[] | (NestedRoute | PageRoute)[];
}) => {
  const importLoadableCode = `import loadable from '@modern-js/runtime/loadable'`;

  let routeComponentsCode = `
    export const routes = [
  `;
  for (const route of routes) {
    if ('type' in route) {
      const newRoute = traverseRouteTree(route);
      routeComponentsCode += `${JSON.stringify(newRoute, null, 2)
        .replace(/"(loadable[^"]*)"/g, '$1')
        .replace(/"(_loaders[^"]*)"/g, '$1')},`;
    } else {
      const finalRoute = {
        ...route,
        component: `loadable(() => import('${route._component}'))`,
      };

      routeComponentsCode += `${JSON.stringify(finalRoute, null, 2)
        .replace(/"(loadable[^"]*)"/g, '$1')
        .replace(/"(_loaders[^"]*)"/g, '$1')},`;
    }
  }
  routeComponentsCode += `\n];`;
  return `
    ${importLoadableCode}
    ${routeComponentsCode}
  `;
};
