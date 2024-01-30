import { Server as NodeServer } from 'node:http';
import {
  ServerBase,
  ServerBaseOptions,
  BindRenderHandleOptions,
  createNodeServer,
  createStaticMiddleware,
  bindRenderHandler,
  favionFallbackMiddleware,
  bindDataHandlers,
  injectReporter,
  injectLogger,
  createErrorHtml,
} from '@modern-js/server-core/base';
import { createLogger } from '@modern-js/utils';
import { Logger, Reporter } from '@modern-js/types';
import { ErrorDigest, onError } from './error';

interface MonitoOptions {
  logger?: Logger;
}

export type ProdServerOptions = ServerBaseOptions &
  BindRenderHandleOptions &
  MonitoOptions;

type BaseEnv = {
  Variables: {
    logger: Logger;
    reporter: Reporter;
  };
};

export const createProdServer = async (
  options: ProdServerOptions,
): Promise<NodeServer> => {
  const server = new ServerBase(options);
  await initProdMiddlewares(server, options);
  await server.init();
  const nodeServer = createNodeServer(server.handle.bind(server), server);
  return nodeServer;
};

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

  await server.init();

  await bindDataHandlers(server, routes!, pwd);

  await bindRenderHandler(server, options);

  return server;
};
