import type { APIHandlerInfo } from '@modern-js/bff-core';
import type { PluginAPI, ServerMiddleware } from '@modern-js/server-core';
import { CustomServer } from '@modern-js/server-core';
import { isProd } from '@modern-js/utils';
import { Hono } from 'hono';
import type { Context, MiddlewareHandler, Next } from 'hono';
import createHonoRoutes from '../utils/createHonoRoutes';

const before = ['custom-server-hook', 'custom-server-middleware', 'render'];

type SF = (args: any) => void;

interface MiddlewareOptions {
  prefix: string;
  enableHandleWeb?: boolean;
  customMiddlewares: SF[];
}

export class HonoRuntime {
  apiMiddleware: ServerMiddleware[] = [];
  apiServer: Hono | null = null;
  api: PluginAPI;
  isHono = true;
  constructor(api: PluginAPI) {
    this.api = api;
  }

  setHandlers = async () => {
    if (!this.isHono) {
      return;
    }
    const { apiHandlerInfos } = this.api.useAppContext();

    const honoHandlers = createHonoRoutes(apiHandlerInfos as APIHandlerInfo[]);
    this.apiMiddleware = honoHandlers.map(({ path, method, handler }) => ({
      name: `bff-api-${method}-${path}`,
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
      this.apiServer?.[method](path, ...handlers);
    });
  };

  registerMiddleware = async (options: MiddlewareOptions) => {
    const { prefix, enableHandleWeb, customMiddlewares } = options;

    const { bff } = this.api.useConfigContext();
    if ((bff as any)?.runtimeFramework !== 'hono') {
      this.isHono = false;
      return;
    }

    const { serverBase } = this.api.useAppContext();
    const hooks = (this.api as any).getHooks();
    const { distDirectory: pwd, middlewares: globalMiddlewares } =
      this.api.useAppContext();

    const customServer = new CustomServer(hooks, serverBase!, pwd);

    const customServerMiddleware = await customServer.getServerMiddleware();

    customServerMiddleware &&
      globalMiddlewares.push({
        name: 'bff-custom-server-middleware',
        path: `${prefix}/*`,
        handler: customServerMiddleware,
        order: 'post',
        before,
      });

    (customMiddlewares as unknown as MiddlewareHandler[]).forEach(handler => {
      globalMiddlewares.push({
        name: 'bff-custom-middleware',
        handler: (c: Context, next: Next) => {
          if (c.req.path.startsWith(prefix || '/api') || enableHandleWeb) {
            return handler(c, next);
          } else {
            return next();
          }
        },
        order: 'post',
        before,
      });
    });

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
