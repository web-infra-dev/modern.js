import path from 'path';
import { API_DIR, ApiRouter } from '@modern-js/bff-core';
import type { Plugin } from '@modern-js/plugin-v2';
import { server } from '@modern-js/plugin-v2/server';
import {
  type ServerConfig,
  type ServerPlugin,
  type ServerPluginLegacy,
  compatPlugin,
  handleSetupResult,
} from '@modern-js/server-core';
import { assign } from '@modern-js/utils/lodash';

export async function serverInit({
  plugins,
  serverConfig,
}: {
  plugins?: (ServerPlugin | ServerPluginLegacy)[];
  serverConfig?: ServerConfig;
}) {
  const { serverContext } = await server.run({
    plugins: [compatPlugin(), ...(plugins || [])] as Plugin[],
    options: { appContext: {}, pwd: process.cwd() },
    config: assign(
      {},
      {
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
    ),
    handleSetupResult,
  });

  const hooks = serverContext.pluginAPI?.getHooks();

  return hooks as any;
}

export const APIPlugin: ServerPluginLegacy = {
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
