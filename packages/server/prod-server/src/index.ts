import {
  createNodeServer,
  loadServerEnv,
} from '@modern-js/server-core/base/node';
import { createServerBase } from '@modern-js/server-core/base';
import { initProdMiddlewares } from './init';
import { BaseEnv, ProdServerOptions } from './types';

export { initProdMiddlewares, type InitProdMiddlewares } from './init';

export type { ProdServerOptions, BaseEnv } from './types';

export const createProdServer = async (options: ProdServerOptions) => {
  const server = createServerBase<BaseEnv>(options);
  // load env file.
  await loadServerEnv(options);
  await server.init();

  const nodeServer = await createNodeServer(server.handle.bind(server));
  await server.runner.beforeServerInit({
    app: nodeServer,
  });
  // initProdMiddlewares should run after beforeServerInit, because some hooks are currently executed in initProdMIddlewares
  await initProdMiddlewares(server, options);
  return nodeServer;
};
