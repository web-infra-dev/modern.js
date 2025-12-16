import { createServerBase } from '@modern-js/server-core';
import {
  loadServerCliConfig,
  loadServerEnv,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';
import { applyPlugins } from './apply/node';
import type { BaseEnv, ProdServerOptions } from './types';

export type { BaseEnv, ProdServerOptions } from './types';

export const createCloudflareWorkersFunction = async (
  options: ProdServerOptions,
) => {
  await loadServerEnv(options);

  const serverBaseOptions = options;

  const serverCliConfig = loadServerCliConfig(options.pwd, options.config);

  if (serverCliConfig) {
    options.config = serverCliConfig;
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

  await applyPlugins(server, options);
  await server.init();
  return (request: Request, env: any, context: any) => {
    return server.handle(request, env, context);
  };
};
