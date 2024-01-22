import { Server as NodeServer } from 'node:http';
import path from 'path';
import type { ServerBaseOptions } from '@modern-js/server-core/base';
import {
  createServerBase,
  createNodeServer,
  createStaticMiddleware,
  bindRenderHandler,
  favionFallbackMiddleware,
} from '@modern-js/server-core/base';

export default async (
  options: Omit<ServerBaseOptions, 'app'>,
): Promise<NodeServer> => {
  const { config, pwd } = options;
  const distDir = path.resolve(pwd, config.output.path || 'dist');

  const server = await createServerBase(options);

  const staticMiddleware = createStaticMiddleware({
    distDir,
    output: config?.output || {},
    html: config?.html || {},
  });

  server.get('*', staticMiddleware);
  server.get('*', favionFallbackMiddleware);

  await server.init();
  const nodeServer = createNodeServer(server.handle.bind(server), server);

  // bind render handler
  await bindRenderHandler(server, distDir, options);

  return nodeServer;
};
