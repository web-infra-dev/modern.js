import { createNodeServer } from '@modern-js/server-core/base';
import { createWebServer } from './handler';
import { ProdServerOptions } from './types';

export { initProdMiddlewares, type InitProdMiddlewares } from './handler';

export type { ProdServerOptions, BaseEnv } from './types';

export const createProdServer = async (options: ProdServerOptions) => {
  const server = await createWebServer(options);

  const nodeServer = createNodeServer(server.handle.bind(server));
  await server.runner.beforeServerInit({
    app: nodeServer,
  });
  return nodeServer;
};
