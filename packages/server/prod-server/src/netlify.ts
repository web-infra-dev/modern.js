import { createBaseProdServer } from './base-server';
import type { ProdServerOptions } from './types';

export type { BaseEnv, ProdServerOptions } from './types';

export const createNetlifyFunction = async (options: ProdServerOptions) => {
  const { server, init } = await createBaseProdServer(options);

  await init();

  return (request: Request, context: unknown) => {
    return server.handle(request, context);
  };
};
