import { createNodeServer } from '@modern-js/server-core/node';
import { createBaseProdServer } from './base-server';
import type { ProdServerOptions } from './types';

export { applyPlugins, type ApplyPlugins } from './apply';

export {
  loadServerPlugins,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';

export type { ServerPlugin } from '@modern-js/server-core';

export type { BaseEnv, ProdServerOptions } from './types';

export const createProdServer = async (options: ProdServerOptions) => {
  const { server, init } = await createBaseProdServer(options);

  const nodeServer = await createNodeServer(server.handle.bind(server));

  await init({
    nodeServer,
    noStaticServer: Boolean(process.env.MODERN_SERVER_BUNDLE),
  });

  return nodeServer;
};
