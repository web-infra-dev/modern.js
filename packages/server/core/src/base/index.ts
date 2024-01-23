import { ServerBase } from './serverBase';
import { ServerNodeContext, ServerBaseOptions, Next } from './types';
import { createNodeServer } from './adapters/node';
import { httpCallBack2HonoMid, connectMid2HonoMid } from './adapters/hono';
import { registerMockHandler } from './adapters/mock';

export { createStaticMiddleware } from './adapters/serverStatic';
export type { CreateRenderHOptions } from './renderHandler';
export { bindRenderHandler } from './renderHandler';
export * from './middlewares';

export { httpCallBack2HonoMid, connectMid2HonoMid };
export type { ServerNodeContext, ServerBaseOptions, Next };
export { registerMockHandler };
export { createNodeServer, ServerBase };

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
