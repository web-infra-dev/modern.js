import path from 'path';
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
  loadServerEnv,
  bindBFFHandler,
  createServerBase,
} from '@modern-js/server-core/base';
import { createLogger, fs } from '@modern-js/utils';
import { Logger, Reporter } from '@modern-js/types';
import { ErrorDigest, onError } from './error';

interface MonitoOptions {
  logger?: Logger;
}

export type ProdServerOptions = ServerBaseOptions &
  Omit<BindRenderHandleOptions, 'templates'> &
  MonitoOptions;

type BaseEnv = {
  Variables: {
    logger: Logger;
    reporter: Reporter;
  };
};

export const createProdServer = async (options: ProdServerOptions) => {
  const server = createServerBase<BaseEnv>(options);

  // load env file.
  await loadServerEnv(options);

  await server.init();
  const nodeServer = createNodeServer(server.handle.bind(server));
  await server.runner.beforeServerInit({
    app: nodeServer,
  });
  await initProdMiddlewares(server, options);
  return nodeServer;
};

export type InitProdMiddlewares = typeof initProdMiddlewares;

export const initProdMiddlewares = async (
  server: ServerBase<BaseEnv>,
  options: ProdServerOptions,
) => {
  const { config, pwd, routes, logger: inputLogger } = options;

  const htmls = await Promise.all(
    options.routes?.map(async route => {
      let html: string | undefined;
      try {
        const htmlPath = path.join(pwd, route.entryPath);
        html = await fs.readFile(htmlPath, 'utf-8');
      } catch (e) {
        // ignore error
      }
      return [route.entryName!, html];
    }) || [],
  );

  const templates: Record<string, string> = Object.fromEntries(htmls);

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

  await bindBFFHandler(server, {
    ...options,
    templates,
  });
  await bindDataHandlers(server, routes || [], pwd);
  await bindRenderHandler(server, {
    ...options,
    templates,
  });

  return server;
};
