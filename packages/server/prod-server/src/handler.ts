import {
  ServerBase,
  createStaticMiddleware,
  bindRenderHandler,
  favionFallbackMiddleware,
  injectReporter,
  injectLogger,
  createErrorHtml,
  bindBFFHandler,
  createInjectHtml,
  createServerBase,
  loadServerEnv,
} from '@modern-js/server-core/base';
import { createLogger } from '@modern-js/utils';
import { ErrorDigest, onError } from './error';
import { ProdServerOptions, BaseEnv } from './types';

export type * from './types';

export async function createRequestHandler(
  options: ProdServerOptions,
): Promise<ReturnType<typeof createServerBase>['handle']> {
  const server = await createWebServer(options);

  return server.handle.bind(server);
}

export async function createWebServer(options: ProdServerOptions) {
  const server = createServerBase<BaseEnv>(options);
  // load env file.
  await loadServerEnv(options);
  await server.init();
  await initProdMiddlewares(server, options);

  return server;
}

export type InitProdMiddlewares = typeof initProdMiddlewares;
export const initProdMiddlewares = async (
  server: ServerBase<BaseEnv>,
  options: ProdServerOptions,
) => {
  const { config, pwd, routes, logger: inputLogger } = options;

  const logger = inputLogger || createLogger({ level: 'warn' });
  const staticMiddleware = createStaticMiddleware({
    pwd,
    output: config?.output || {},
    html: config?.html || {},
  });

  server.all('*', injectReporter());
  server.all('*', injectLogger(logger));
  // inject html templates
  server.all('*', createInjectHtml(pwd, routes));

  server.notFound(c => {
    const logger = c.get('logger');
    onError(logger, ErrorDigest.ENOTF, '404 not found', c.req.raw);
    return c.html(createErrorHtml(404), 404);
  });

  server.onError((err, c) => {
    const logger = c.get('logger');
    onError(logger, ErrorDigest.EINTER, err, c.req.raw);
    return c.html(createErrorHtml(500), 500);
  });

  server.get('*', staticMiddleware);
  server.get('*', favionFallbackMiddleware);

  await bindBFFHandler(server, options);

  await bindRenderHandler(server, options);

  return server;
};
