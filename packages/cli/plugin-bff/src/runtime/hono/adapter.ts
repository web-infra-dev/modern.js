import type { APIHandlerInfo } from '@modern-js/bff-core';
import type { ServerMiddleware, ServerPluginAPI } from '@modern-js/server-core';

import createHonoRoutes from '../../utils/createHonoRoutes';

const before = ['custom-server-hook', 'custom-server-middleware', 'render'];

export class HonoAdapter {
  apiMiddleware: ServerMiddleware[] = [];
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

  /**
   * Register the BFF API routes as ordinary server middlewares.
   *
   * Dev and prod now share this single path: the routes are pushed straight
   * into the server's middleware list. In dev, hot updates are handled by the
   * unified `@modern-js/server` runtime reload (which rebuilds the whole
   * runtime — including this plugin — from scratch), so BFF no longer needs its
   * own swappable Hono sub-app / dynamic dispatch middleware.
   */
  registerMiddleware = async () => {
    const { bffRuntimeFramework } = this.api.getServerContext();

    if (bffRuntimeFramework !== 'hono') {
      this.isHono = false;
      return;
    }

    const { middlewares: globalMiddlewares } = this.api.getServerContext();

    await this.setHandlers();

    globalMiddlewares.push(...this.apiMiddleware);
  };
}
