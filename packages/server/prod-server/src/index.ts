import {
  createNodeServer,
  loadServerConfig,
  loadServerEnv,
} from '@modern-js/server-core/node';
import { createServerBase } from '@modern-js/server-core';
import { BaseEnv, ProdServerOptions } from './types';
import { applyPlugins } from './apply';

export { applyPlugins, type ApplyPlugins } from './apply';

export {
  loadServerPlugins,
  loadServerConfig,
} from '@modern-js/server-core/node';
export type { ServerPlugin } from '@modern-js/server-core';

export type { ProdServerOptions, BaseEnv } from './types';

export const createProdServer = async (options: ProdServerOptions) => {
  await loadServerEnv(options);
  const serverConfig = loadServerConfig(
    options.pwd,
    options.serverConfigFile,
    options.serverConfigPath,
  );

  const server = createServerBase<BaseEnv>({
    ...options,
    serverConfig,
  });

  await applyPlugins(server, options);

  // load env file.
  const nodeServer = await createNodeServer(server.handle.bind(server));
  await server.init({ nodeServer });

  return nodeServer;
};
