import {
  ServerBase,
  bindRenderHandler,
  favionFallbackMiddleware,
  injectReporter,
  injectLogger,
  createErrorHtml,
  createServerBase,
} from '@modern-js/server-core/base';
import { createLogger } from '@modern-js/utils';
import {
  loadServerEnv,
  injectTemplates,
  bindBFFHandler,
  injectServerManifest,
  createStaticMiddleware,
} from '@modern-js/server-core/base/node';
import { ErrorDigest, onError } from './error';
import { ProdServerOptions, BaseEnv } from './types';

export type { ProdServerOptions, BaseEnv } from './types';

export async function createRequestHandler(
  options: ProdServerOptions,
): Promise<ReturnType<typeof createServerBase>['handle']> {
  const server = await createWebServer(options);
  await initProdMiddlewares(server, options);
  return server.handle.bind(server);
}

export async function createWebServer(options: ProdServerOptions) {
  const server = createServerBase<BaseEnv>(options);
  // load env file.
  await loadServerEnv(options);
  await server.init();

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
    routes,
  });

  server.all('*', injectReporter());
  server.all('*', injectLogger(logger));

  server.all('*', injectServerManifest(pwd, routes));
  // inject html templates
  server.all('*', injectTemplates(pwd, routes));

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
