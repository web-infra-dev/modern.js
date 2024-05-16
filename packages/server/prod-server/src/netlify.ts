import { loadServerEnv } from '@modern-js/server-core/base/node';
import { createServerBase } from '@modern-js/server-core/base';
import { initProdMiddlewares } from './init';
import { BaseEnv, ProdServerOptions } from './types';

export { initProdMiddlewares, type InitProdMiddlewares } from './init';

export type { ProdServerOptions, BaseEnv } from './types';

export const createNetlifyFunction = async (options: ProdServerOptions) => {
  const server = createServerBase<BaseEnv>(options);
  await loadServerEnv(options);
  await server.init();

  await initProdMiddlewares(server, options);
  return (request: Request, context: unknown) => {
    return server.handle(request, context);
  };
};
