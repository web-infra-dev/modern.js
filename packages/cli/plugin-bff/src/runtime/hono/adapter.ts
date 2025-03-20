import type { APIHandlerInfo } from '@modern-js/bff-core';
import type { PluginAPI, ServerMiddleware } from '@modern-js/server-core';
import { isProd } from '@modern-js/utils';
import { Hono } from 'hono';
import type { Context, MiddlewareHandler, Next } from 'hono';
import createHonoRoutes from '../../utils/createHonoRoutes';

const before = ['custom-server-hook', 'custom-server-middleware', 'render'];

interface MiddlewareOptions {
  prefix: string;
  enableHandleWeb?: boolean;
}

export class HonoAdapter {
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
      this.apiServer?.[method](path, ...handlers);
    });
  };

  registerMiddleware = async (options: MiddlewareOptions) => {
    const { prefix } = options;

    const { bffRuntimeFramework } = this.api.useAppContext();

    if (bffRuntimeFramework !== 'hono') {
      this.isHono = false;
      return;
    }

    const { middlewares: globalMiddlewares } = this.api.useAppContext();

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
