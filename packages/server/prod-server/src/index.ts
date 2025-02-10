import { createServerBase } from '@modern-js/server-core';
import {
  createNodeServer,
  loadServerCliConfig,
  loadServerEnv,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';
import sourceMapSupport from 'source-map-support';
import {
  type ApplyPlugins,
  applyPlugins as defaultApplyPlugins,
} from './apply';
import type { BaseEnv, ProdServerOptions } from './types';

sourceMapSupport.install();

export { applyPlugins, type ApplyPlugins } from './apply';

export {
  loadServerPlugins,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';

export type { ServerPlugin } from '@modern-js/server-core';

export type { ProdServerOptions, BaseEnv } from './types';

export const createProdServer = async (
  options: ProdServerOptions,
  applyPlugins?: ApplyPlugins,
) => {
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
    options.pwd,
    options.serverConfigFile,
    options.serverConfigPath,
  );

  if (serverRuntimeConfig) {
    serverBaseOptions.serverConfig = serverRuntimeConfig;
  }

  const server = createServerBase<BaseEnv>(serverBaseOptions);

  // load env file.
  const nodeServer = await createNodeServer(server.handle.bind(server));

  await (applyPlugins || defaultApplyPlugins)(server, options, nodeServer);

  await server.init();

  return nodeServer;
};
