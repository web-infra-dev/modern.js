import { Server as NodeServer } from 'node:http';
import path from 'path';
import type {
  ServerBase,
  ServerBaseOptions,
} from '@modern-js/server-core/base';
import {
  createServerBase,
  createNodeServer,
  createStaticMiddleware,
  bindRenderHandler,
  favionFallbackMiddleware,
} from '@modern-js/server-core/base';

// for deploy
export const createProdServer = async (
  options: ServerBaseOptions,
): Promise<NodeServer> => {
  const server = await createServerBase(options);

  return createServer(options, server);
};

// for dev server
export const createServer = async (
  options: ServerBaseOptions,
  server: ServerBase,
) => {
  const { config, pwd } = options;
  const distDir = path.resolve(pwd, config.output.path || 'dist');

  const staticMiddleware = createStaticMiddleware({
    distDir,
    output: config?.output || {},
    html: config?.html || {},
  });

  server.get('*', staticMiddleware);
  server.get('*', favionFallbackMiddleware);

  await server.init();

  // bind render handler
  await bindRenderHandler(server, distDir, options);

  const nodeServer = createNodeServer(server.handle.bind(server), server);

  return nodeServer;
};
