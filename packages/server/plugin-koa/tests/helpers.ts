import path from 'path';
import {
  ServerPlugin,
  PluginManager,
  createContext,
  ServerConfig,
} from '@modern-js/server-core';
import { ApiRouter, API_DIR } from '@modern-js/bff-core';

export function createPluginManager({
  serverConfig,
}: {
  serverConfig?: ServerConfig;
} = {}) {
  const appContext = createContext<any>({});

  const pluginManager = new PluginManager({
    cliConfig: {
      dev: {},
      output: {},
      source: {},
      tools: {},
      server: {},
      html: {},
      runtime: {},
      bff: {},
      security: {},
    },
    serverConfig,
    appContext,
  });

  return pluginManager;
}

export const APIPlugin: ServerPlugin = {
  name: 'api-plugin',

  setup(api) {
    return {
      async prepareApiServer(props, next) {
        const { pwd, prefix, httpMethodDecider } = props;
        const apiDir = path.resolve(pwd, API_DIR);
        const appContext = api.useAppContext();
        const apiRouter = new ApiRouter({
          appDir: pwd,
          apiDir,
          prefix,
          httpMethodDecider,
        });
        const apiMode = apiRouter.getApiMode();
        const apiHandlerInfos = await apiRouter.getApiHandlers();
        const middleware = props.config?.middleware;

        api.setAppContext({
          ...appContext,
          apiMiddlewares: middleware,
          apiRouter,
          apiHandlerInfos,
          apiMode,
        });

        return next(props);
      },
    };
  },
};
