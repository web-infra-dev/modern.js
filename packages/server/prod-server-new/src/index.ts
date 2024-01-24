import { Server as NodeServer } from 'node:http';
import type {
  ServerBase,
  ServerBaseOptions,
  BindRenderHandleOptions,
} from '@modern-js/server-core/base';
import {
  createServerBase,
  createNodeServer,
  createStaticMiddleware,
  bindRenderHandler,
  favionFallbackMiddleware,
} from '@modern-js/server-core/base';

export type ProdServerOptions = ServerBaseOptions & BindRenderHandleOptions;

// for deploy
export const createProdServer = async (
  options: ProdServerOptions,
): Promise<NodeServer> => {
  const server = await createServerBase(options);

  return createServer(options, server);
};

// for dev server
export const createServer = async (
  options: ProdServerOptions,
  server: ServerBase,
) => {
  const { config, pwd } = options;

  const staticMiddleware = createStaticMiddleware({
    pwd,
    output: config?.output || {},
    html: config?.html || {},
  });

  server.get('*', staticMiddleware);
  server.get('*', favionFallbackMiddleware);

  await server.init();

  // bind render handler
  await bindRenderHandler(server, options);

  const nodeServer = createNodeServer(server.handle.bind(server), server);

  return nodeServer;
};
