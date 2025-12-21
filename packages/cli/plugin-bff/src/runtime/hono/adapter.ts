import type { APIHandlerInfo } from '@modern-js/bff-core';
import type {
  Context,
  MiddlewareHandler,
  Next,
  ServerMiddleware,
  ServerPluginAPI,
} from '@modern-js/server-core';
import { Hono } from '@modern-js/server-core';

import { isProd, logger } from '@modern-js/utils';
import createHonoRoutes from '../../utils/createHonoRoutes';

const before = ['custom-server-hook', 'custom-server-middleware', 'render'];

interface MiddlewareOptions {
  prefix: string;
  enableHandleWeb?: boolean;
}

export class HonoAdapter {
  apiMiddleware: ServerMiddleware[] = [];
  apiServer: Hono | null = null;
  api: ServerPluginAPI;
  isHono = true;
  constructor(api: ServerPluginAPI) {
    this.api = api;
  }

  setHandlers = async () => {
    if (!this.isHono) {
      return;
    }
    const { apiHandlerInfos } = this.api.getServerContext();

    const honoHandlers = createHonoRoutes(apiHandlerInfos as APIHandlerInfo[]);
    this.apiMiddleware = honoHandlers.map(({ path, method, handler }) => ({
      name: 'hono-bff-api',
      path,
      method,
      handler,
      order: 'post',
      before,
    }));
  };

  registerApiRoutes = async () => {
    if (!this.isHono) {
      return;
    }
    this.apiServer = new Hono();
    this.apiMiddleware.forEach(({ path = '*', method = 'all', handler }) => {
      const handlers = this.wrapInArray(handler);
      if (handlers.length === 0) {
        return;
      }
      const firstHandler = handlers[0]!;
      const restHandlers = handlers.slice(1);
      /**
       * When we call `apiServer[method]` directly, TypeScript may choose the overload
       * where the first argument is a handler (no `path`), and then rejects `path: string`.
       * We ensure at least one handler exists and cast to the "path + handlers" signature.
       */
      type RouteMethod =
        | 'options'
        | 'get'
        | 'post'
        | 'put'
        | 'delete'
        | 'patch'
        | 'all';
      type Register = (
        path: string,
        handler: MiddlewareHandler,
        ...handlers: MiddlewareHandler[]
      ) => unknown;
      const m = method as RouteMethod;
      const server = this.apiServer;
      if (!server) {
        return;
      }
      const register = server[m] as unknown as Register;
      register.call(server, path, firstHandler, ...restHandlers);
    });

    this.apiServer.onError(async (err, c) => {
      try {
        const serverConfig = this.api.getServerConfig();
        const onErrorHandler = serverConfig?.onError;

        if (onErrorHandler) {
          const result = await onErrorHandler(err, c);
          if (result instanceof Response) {
            return result;
          }
        } else {
          logger.error(err);
        }
      } catch (configError) {
        logger.error(`Error in serverConfig.onError handler: ${configError}`);
      }
      return c.json(
        {
          message: (err as any)?.message || '[BFF] Internal Server Error',
        },
        (err as any)?.status || 500,
      );
    });
  };

  registerMiddleware = async (options: MiddlewareOptions) => {
    const { prefix } = options;

    const { bffRuntimeFramework } = this.api.getServerContext();

    if (bffRuntimeFramework !== 'hono') {
      this.isHono = false;
      return;
    }

    const { middlewares: globalMiddlewares } = this.api.getServerContext();

    await this.setHandlers();

    if (isProd()) {
      globalMiddlewares.push(...this.apiMiddleware);
    } else {
      await this.registerApiRoutes();
      /** api hot update */
      const dynamicApiMiddleware: ServerMiddleware = {
        name: 'dynamic-bff-handler',
        path: `${prefix}/*`,
        method: 'all',
        order: 'post',
        before,
        handler: async (c: Context, next: Next) => {
          if (this.apiServer) {
            const response = await this.apiServer.fetch(c.req.raw, c.env);
            if (response.status !== 404) {
              return new Response(response.body, response);
            }
          }
          await next();
        },
      };
      globalMiddlewares.push(dynamicApiMiddleware);
    }
  };
  wrapInArray(
    handler: MiddlewareHandler[] | MiddlewareHandler,
  ): MiddlewareHandler[] {
    if (Array.isArray(handler)) {
      return handler;
    } else {
      return [handler];
    }
  }
}
