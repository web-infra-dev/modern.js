import { createServerBase } from '@modern-js/server-core';
import {
  createNodeServer,
  loadServerCliConfig,
  loadServerEnv,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';
import { applyPlugins } from './apply/node';
import type { BaseEnv, ProdServerOptions } from './types';

export { applyPlugins, type ApplyPlugins } from './apply/node';

export {
  loadServerPlugins,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';

export type { ServerPlugin } from '@modern-js/server-core';

export type { ProdServerOptions, BaseEnv } from './types';

export const createProdServer = async (options: ProdServerOptions) => {
  await loadServerEnv(options);

  const serverBaseOptions = options;

  const serverCliConfig =
    process.env.NODE_ENV === 'production'
      ? loadServerCliConfig(options.pwd, options.config)
      : options.config;

  if (serverCliConfig) {
    serverBaseOptions.config = serverCliConfig;
  }

  const serverRuntimeConfig = await loadServerRuntimeConfig(
    options.serverConfigPath,
  );

  if (serverRuntimeConfig) {
    serverBaseOptions.serverConfig = serverRuntimeConfig;
    serverBaseOptions.plugins = [
      ...(serverRuntimeConfig.plugins || []),
      ...(options.plugins || []),
    ];
  }

  const server = createServerBase<BaseEnv>(serverBaseOptions);

  // load env file.
  const nodeServer = await createNodeServer(server.handle.bind(server));

  await applyPlugins(server, options, nodeServer);

  await server.init();

  return nodeServer;
};
