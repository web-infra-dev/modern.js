import path from 'path';
import { ApiRouter } from '@modern-js/bff-core';
import type { MiddlewareHandler, ServerPlugin } from '@modern-js/server-core';
import type { ServerNodeMiddleware } from '@modern-js/server-core/node';
import {
  API_DIR,
  isProd,
  isWebOnly,
  requireExistModule,
} from '@modern-js/utils';
import { isFunction } from '@modern-js/utils';
import { API_APP_NAME } from './constants';
import { HonoAdapter } from './runtime/hono/adapter';

type SF = (args: any) => void;
class Storage {
  public middlewares: SF[] = [];

  reset() {
    this.middlewares = [];
  }
}

const createTransformAPI = (storage: Storage) => ({
  addMiddleware(fn: SF) {
    storage.middlewares.push(fn);
  },
});

export default (): ServerPlugin => ({
  name: '@modern-js/plugin-bff',
  setup: api => {
    const storage = new Storage();
    const transformAPI = createTransformAPI(storage);
    let apiAppPath = '';
    let apiRouter: ApiRouter;

    const honoAdapter = new HonoAdapter(api);

    api.onPrepare(async () => {
      const appContext = api.getServerContext();
      const { appDirectory, distDirectory, render } = appContext;
      const root = isProd() ? distDirectory : appDirectory;
      const apiPath = path.resolve(root || process.cwd(), API_DIR);
      apiAppPath = path.resolve(apiPath, API_APP_NAME);

      const apiMod = await requireExistModule(apiAppPath);
      if (apiMod && typeof apiMod === 'function') {
        apiMod(transformAPI);
      }

      const { middlewares } = storage;
      api.updateServerContext({
        ...appContext,
        apiMiddlewares: middlewares,
      });

      /** bind api server */
      const config = api.getServerConfig();
      const prefix = config?.bff?.prefix || '/api';
      const enableHandleWeb = config?.bff?.enableHandleWeb;
      const httpMethodDecider = config?.bff?.httpMethodDecider;

      const { distDirectory: pwd, middlewares: globalMiddlewares } =
        api.getServerContext();

      const webOnly = await isWebOnly();

      let handler: ServerNodeMiddleware;

      if (webOnly) {
        handler = async (c, next) => {
          c.body('');
          await next();
        };
      } else {
        const runner = api.getHooks();
        const renderHandler = enableHandleWeb ? render : null;
        handler = await runner.prepareApiServer.call({
          pwd: pwd!,
          prefix,
          render: renderHandler,
          httpMethodDecider,
        });
      }

      if (handler && isFunction(handler)) {
        globalMiddlewares.push({
          name: 'bind-bff',
          handler: ((c, next) => {
            if (!c.req.path.startsWith(prefix) && !enableHandleWeb) {
              return next();
            } else {
              return handler(c, next);
            }
          }) as MiddlewareHandler,
          order: 'post',
          before: ['custom-server-hook', 'custom-server-middleware', 'render'],
        });
      }

      honoAdapter.registerMiddleware({
        prefix,
        enableHandleWeb,
      });
    });
    api.onReset(async ({ event }) => {
      storage.reset();
      const appContext = api.getServerContext();
      const newApiModule = await requireExistModule(apiAppPath);
      if (newApiModule && typeof newApiModule === 'function') {
        newApiModule(transformAPI);
      }

      const { middlewares } = storage;
      api.updateServerContext({
        ...appContext,
        apiMiddlewares: middlewares,
      });

      if (event.type === 'file-change') {
        const apiHandlerInfos = await apiRouter.getApiHandlers();
        const appContext = api.getServerContext();
        api.updateServerContext({
          ...appContext,
          apiHandlerInfos,
        });

        await honoAdapter.setHandlers();
        await honoAdapter.registerApiRoutes();
      }
    });
    api.prepareApiServer((async (input: any, next: any) => {
      const { pwd, prefix, httpMethodDecider } = input;
      const apiDir = path.resolve(pwd, API_DIR);
      const appContext = api.getServerContext();
      const { apiDirectory, lambdaDirectory } = appContext;
      apiRouter = new ApiRouter({
        appDir: pwd,
        apiDir: (apiDirectory as string) || apiDir,
        lambdaDir: lambdaDirectory as string,
        prefix,
        httpMethodDecider,
      });
      const apiMode = apiRouter.getApiMode();

      const apiHandlerInfos = await apiRouter.getApiHandlers();
      api.updateServerContext({
        ...appContext,
        apiRouter,
        apiHandlerInfos,
        apiMode,
      });
      return next(input);
    }) as any);
  },
});
