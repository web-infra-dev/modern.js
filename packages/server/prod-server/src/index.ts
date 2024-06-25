import {
  createNodeServer,
  // loadServerConfig,
  loadServerRuntimeConfig,
  loadServerCliConfig,
  loadServerEnv,
} from '@modern-js/server-core/node';
import { createServerBase } from '@modern-js/server-core';
import { BaseEnv, ProdServerOptions } from './types';
import { applyPlugins } from './apply';

export { applyPlugins, type ApplyPlugins } from './apply';

export {
  loadServerPlugins,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';
export type { ServerPlugin } from '@modern-js/server-core';

export type { ProdServerOptions, BaseEnv } from './types';

export const createProdServer = async (options: ProdServerOptions) => {
  await loadServerEnv(options);

  const serverCliConfig = loadServerCliConfig(options.pwd, options.config);

  if (serverCliConfig) {
    options.config = serverCliConfig;
  }

  const serverRuntimeConfig = loadServerRuntimeConfig(
    options.pwd,
    options.serverConfigFile,
    options.serverConfigPath,
  );

  const serverBaseOptions = options;

  if (serverRuntimeConfig) {
    serverBaseOptions.serverConfig = serverRuntimeConfig;
  }

  const server = createServerBase<BaseEnv>(serverBaseOptions);

  // load env file.
  const nodeServer = await createNodeServer(server.handle.bind(server));

  await applyPlugins(server, options, nodeServer);

  await server.init();

  return nodeServer;
};
