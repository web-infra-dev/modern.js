import { ServerBase } from './serverBase';
import { ServerNodeContext, ServerBaseOptions, Next } from './types';
import { createNodeServer } from './adapters/node';
import { httpCallBack2HonoMid } from './adapters/hono';

export { createStaticMiddleware } from './adapters/serverStatic';
export type { CreateRenderHOptions } from './renderHandler';
export { bindRenderHandler } from './renderHandler';
export * from './middlewares';

export { httpCallBack2HonoMid };
export type { ServerNodeContext, ServerBaseOptions, Next };
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
