import type { RuntimePlugin } from '@modern-js/core';
import type { Entrypoint, Route } from '@modern-js/types';

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
        : `if (isReact18) {
  root = ReactDOM.createRoot(document.getElementById(MOUNT_ID || 'root'))
  bootstrap(AppWrapper, MOUNT_ID, root.render, ReactDOM.hydrateRoot);
} else {
  bootstrap(AppWrapper, MOUNT_ID.render, ReactDOM.hydrate);
}`
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

export const fileSystemRoutes = ({ routes }: { routes: Route[] }) => `
import loadable from '@modern-js/runtime/loadable';

${routes
  .map(
    ({ component, _component }) =>
      `const ${component} = loadable(() => import('${_component}'));`,
  )
  .join('\n\n')}


export const routes = ${JSON.stringify(routes, null, 2).replace(
  /"component"\s*:\s*"(\S+)"/g,
  '"component": $1',
)}
`;
