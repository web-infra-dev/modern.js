import type { Entrypoint, Route } from '@modern-js/types';

export interface RuntimePlugin {
  name: string;
  options: string;
}

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
const IS_BROWSER = typeof window !== 'undefined';
const MOUNT_ID = '${mountId}';

${imports}

let AppWrapper = null;

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
         ({ name, options }) =>
           `${name}({...${options}, ...App?.config?.${name}}),`,
       )
       .join('\n')}
    ]
  })(${fileSystemRoutes ? '' : `App`})

  if (IS_BROWSER) {
    ${
      customBootstrap
        ? `customBootstrap(AppWrapper);`
        : `bootstrap(AppWrapper, MOUNT_ID);`
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
    window.__assetPrefix__ = '<%= staticPrefix %>';
  </script>
  ${partials.head.join('\n')}
</head>

<body>
  <!--<?- chunksMap.css ?>-->
  <noscript>
    We're sorry but react app doesn't work properly without JavaScript enabled. Please enable it to continue.
  </noscript>
  <div id="<%= mountId %>"><!--<?- html ?>--></div>
  ${partials.body.join('\n')}
  <!--<?- chunksMap.js ?>-->
  <!--<?- SSRDataScript ?>-->
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
