import path from 'path';
import { ApiRouter } from '@modern-js/bff-core';
import type { MiddlewareHandler, ServerPlugin } from '@modern-js/server-core';
import type { ServerNodeMiddleware } from '@modern-js/server-core/node';
import { API_DIR, isWebOnly } from '@modern-js/utils';
import { isFunction } from '@modern-js/utils';
import { HonoAdapter } from './runtime/hono/adapter';

type SF = (args: any) => void;
class Storage {
  public middlewares: SF[] = [];
}

export default (): ServerPlugin => ({
  name: '@modern-js/plugin-bff',
  setup: api => {
    const storage = new Storage();
    let apiRouter: ApiRouter;

    const honoAdapter = new HonoAdapter(api);

    api.onPrepare(async () => {
      const appContext = api.getServerContext();
      const { render } = appContext;

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

      // Await: this is the sole BFF Hono registration entry, and onPrepare must
      // finish pushing routes before ServerBase#applyMiddlewares runs.
      await honoAdapter.registerMiddleware();
    });
    // No BFF-local onReset rebuild: in dev, `@modern-js/server` rebuilds the
    // whole runtime (including this plugin) on file changes, so the API routes
    // are re-registered from scratch on every reload.
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
      const apiHandlerInfos = await apiRouter.getApiHandlers();
      api.updateServerContext({
        ...appContext,
        apiRouter,
        apiHandlerInfos,
      });
      return next(input);
    }) as any);
  },
});
