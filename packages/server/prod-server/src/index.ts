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

  const serverBaseOptions = options;

  if (serverConfig) {
    serverBaseOptions.serverConfig = serverConfig;
  }

  const server = createServerBase<BaseEnv>(serverBaseOptions);

  // load env file.
  const nodeServer = await createNodeServer(server.handle.bind(server));

  await applyPlugins(server, options, nodeServer);

  await server.init();

  return nodeServer;
};
