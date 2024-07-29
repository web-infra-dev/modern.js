import path from 'path';
import { ApiRouter } from '@modern-js/bff-core';
import {
  API_DIR,
  isProd,
  isWebOnly,
  requireExistModule,
} from '@modern-js/utils';
import type { ServerPlugin } from '@modern-js/server-core';
import { ServerNodeMiddleware } from '@modern-js/server-core/node';
import { API_APP_NAME } from './constants';

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
    return {
      async prepare() {
        const appContext = api.useAppContext();
        const { appDirectory, distDirectory, render } = appContext;
        const root = isProd() ? distDirectory : appDirectory;
        const apiPath = path.resolve(root || process.cwd(), API_DIR);
        apiAppPath = path.resolve(apiPath, API_APP_NAME);

        const apiMod = requireExistModule(apiAppPath);
        if (apiMod && typeof apiMod === 'function') {
          apiMod(transformAPI);
        }

        const { middlewares } = storage;
        api.setAppContext({
          ...appContext,
          apiMiddlewares: middlewares,
        });

        /** bind api server */
        const config = api.useConfigContext();
        const prefix = config?.bff?.prefix || '/api';
        const enableHandleWeb = config?.bff?.enableHandleWeb;
        const httpMethodDecider = config?.bff?.httpMethodDecider;

        const { distDirectory: pwd, middlewares: globalMiddlewares } =
          api.useAppContext();

        const webOnly = await isWebOnly();

        let handler: ServerNodeMiddleware;

        if (webOnly) {
          handler = async (c, next) => {
            c.body('');
            await next();
          };
        } else {
          const runner = api.useHookRunners();
          const renderHandler = enableHandleWeb ? render : null;
          handler = await runner.prepareApiServer(
            {
              pwd,
              prefix,
              render: renderHandler,
              httpMethodDecider,
            },
            { onLast: () => null as any },
          );
        }

        if (handler) {
          globalMiddlewares.push({
            name: 'bind-bff',
            handler: (c, next) => {
              if (!c.req.path.startsWith(prefix) && !enableHandleWeb) {
                return next();
              } else {
                return handler(c, next);
              }
            },
            order: 'post',
            before: [
              'custom-server-hook',
              'custom-server-middleware',
              'render',
            ],
          });
        }
      },
      reset({ event }) {
        storage.reset();
        const appContext = api.useAppContext();
        const newApiModule = requireExistModule(apiAppPath);
        if (newApiModule && typeof newApiModule === 'function') {
          newApiModule(transformAPI);
        }

        const { middlewares } = storage;
        api.setAppContext({
          ...appContext,
          apiMiddlewares: middlewares,
        });

        if (event.type === 'file-change') {
          const apiHandlerInfos = apiRouter.getApiHandlers();
          const appContext = api.useAppContext();
          api.setAppContext({
            ...appContext,
            apiHandlerInfos,
          });
        }
      },

      prepareApiServer(props, next) {
        const { pwd, prefix, httpMethodDecider } = props;
        const apiDir = path.resolve(pwd, API_DIR);
        const appContext = api.useAppContext();
        const { apiDirectory, lambdaDirectory } = appContext;
        apiRouter = new ApiRouter({
          appDir: pwd,
          apiDir: (apiDirectory as string) || apiDir,
          lambdaDir: lambdaDirectory as string,
          prefix,
          httpMethodDecider,
        });
        const apiMode = apiRouter.getApiMode();
        const apiHandlerInfos = apiRouter.getApiHandlers();
        api.setAppContext({
          ...appContext,
          apiRouter,
          apiHandlerInfos,
          apiMode,
        });
        return next(props);
      },
    };
  },
});
