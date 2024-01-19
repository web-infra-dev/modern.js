import { ServerBase } from './ServerCore';
import { ServerBaseOptions } from './types';
import { createNodeServer } from './adapters/node';

export { createStaticMiddleware } from './adapters/serverStatic';
export type { CreateRenderHOptions } from './renderHandler';
export { createRenderHandler } from './renderHandler';
export { favionFallbackMiddleware } from './middlewares/faviconFallback';
export { createCustomHookMiddleware } from './middlewares/customServerHook';
export type { ServerBaseOptions };
export { createNodeServer };

export async function createServerBase(
  options: Omit<ServerBaseOptions, 'app'>,
) {
  if (options == null) {
    throw new Error('can not start server without options');
  }

  const server = new ServerBase({
    ...options,
  });

  return server;
}
