import path from 'path';
import {
  ServerPlugin,
  PluginManager,
  createContext,
} from '@modern-js/server-core';
import { ApiRouter, API_DIR } from '@modern-js/bff-core';

export function createPluginManager() {
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
    appContext,
  });

  return pluginManager;
}

export const APIPlugin: ServerPlugin = {
  name: 'api-plugin',

  setup(api) {
    return {
      prepareApiServer(props, next) {
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
        const apiHandlerInfos = apiRouter.getApiHandlers();
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
