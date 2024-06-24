import type { Entrypoint } from '@modern-js/types';
import type { RuntimePlugin } from '../../types';
import { APP_CONFIG_NAME } from './constants';

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
  customRuntimeConfig,
}: {
  plugins: RuntimePlugin[];
  customBootstrap?: string | false;
  customRuntimeConfig?: string | false;
  fileSystemRoutes: Entrypoint['fileSystemRoutes'];
}) => {
  const bootstrap = 'bootstrap(AppWrapper, MOUNT_ID, root, ReactDOM)';
  const runtimePlugins = `...(runtimeConfig?.plugins || []),`;

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
       ${customRuntimeConfig ? runtimePlugins : ''}
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

  ${partials.top.join('\n')}

  ${partials.head.join('\n')}

</head>

<body>
  <div id="<%= mountId %>"><!--<?- html ?>--></div>
  ${partials.body.join('\n')}
  <!--<?- chunksMap.js ?>-->
  <!--<?- SSRDataScript ?>-->
  <!--<?- bottomTemplate ?>-->
</body>

</html>
`;
