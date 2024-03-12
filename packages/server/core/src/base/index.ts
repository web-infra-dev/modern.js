import type {
  ServerBaseOptions,
  Next,
  Middleware,
  HonoEnv,
} from '../core/server';
import { ServerBase } from './serverBase';

export { createErrorHtml } from './utils';
export { getHtmlTemplates } from './utils/templates';
export { AGGRED_DIR } from './constants';
export {
  httpCallBack2HonoMid,
  createNodeServer,
  loadServerEnv,
  connectMid2HonoMid,
  sendResponse,
  createStaticMiddleware,
  bindBFFHandler,
  registerMockHandlers,
  createInjectHtml,
  createWebRequest,
  type ServerNodeContext,
  type ServerNodeMiddleware,
} from './adapters/node';

export {
  // favionFallbackMiddleware,
  // injectReporter,
  getRenderHandler,
  // injectLogger,
  bindRenderHandler,
} from './middlewares';

export type { BindRenderHandleOptions } from './middlewares';

export function createServerBase<E extends HonoEnv>(
  options: ServerBaseOptions,
) {
  if (options == null) {
    throw new Error('can not start server without options');
  }

  const server = new ServerBase<E>(options);

  return server;
}

export type { ServerBaseOptions, Next, Middleware, ServerBase };
