import { Hono } from 'hono';
import { ServerCore } from './ServerCore';
import { HonoNodeEnv, ServerCoreOptions } from './types';
import { createNodeServer } from './adapters/node';

export { createStaticMiddleware } from './adapters/serverStatic';
export { createRenderHandler, CreateRenderHOptions } from './renderHandler';
export { favionFallbackMiddleware } from './middlewares/faviconFallback';
export { ServerCoreOptions, createNodeServer };

export async function createServerBase(
  options: Omit<ServerCoreOptions, 'app'>,
) {
  if (options == null) {
    throw new Error('can not start server without options');
  }

  const hono = new Hono<HonoNodeEnv>();

  const server = new ServerCore({
    ...options,
    app: {
      ...hono,
      handle: hono.fetch,
    },
  });

  return server;
}
