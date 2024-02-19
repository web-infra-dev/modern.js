import { ServerBaseOptions, Next, Middleware, HonoEnv } from '../core/server';
import { ServerBase } from './serverBase';
import {
  createNodeServer,
  loadServerEnv,
  httpCallBack2HonoMid,
  connectMid2HonoMid,
  ServerNodeContext,
} from './adapters/node';
import { registerMockHandlers } from './adapters/node/middlewares/mock';

export { createErrorHtml } from './libs/utils';

export { createStaticMiddleware } from './adapters/node/middlewares/serverStatic';
export {
  bindRenderHandler,
  type BindRenderHandleOptions,
} from './renderHandler';
export { injectReporter, injectLogger } from './middlewares/monitor';
export * from './middlewares';
export { bindBFFHandler } from './adapters/node/bff';

export { httpCallBack2HonoMid, connectMid2HonoMid };
export type { ServerNodeContext, ServerBaseOptions, Next, Middleware };
export { registerMockHandlers, loadServerEnv };
export { createNodeServer, ServerBase };

export async function createServerBase<E extends HonoEnv>(
  options: ServerBaseOptions,
) {
  if (options == null) {
    throw new Error('can not start server without options');
  }

  const server = new ServerBase<E>({
    ...options,
  });

  return server;
}
