import { createNodeServer } from '@modern-js/server-core/base/node';
import { createWebServer, initProdMiddlewares } from './handler';
import { ProdServerOptions } from './types';

export { initProdMiddlewares, type InitProdMiddlewares } from './handler';

export type { ProdServerOptions, BaseEnv } from './types';

export const createProdServer = async (options: ProdServerOptions) => {
  const server = await createWebServer(options);
  const nodeServer = createNodeServer(server.handle.bind(server));
  await server.runner.beforeServerInit({
    app: nodeServer,
  });
  // initProdMiddlewares should run after beforeServerInit, because some hooks are currently executed in initProdMIddlewares
  await initProdMiddlewares(server, options);
  return nodeServer;
};
