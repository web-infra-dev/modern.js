import { createServerBase } from '@modern-js/server-core';
import { applyPlugins } from './apply/edge-function';
import type { BaseEnv, ProdServerOptions } from './types';

export type { ProdServerOptions, BaseEnv } from './types';

export const createAliESAFunction = async (options: ProdServerOptions) => {
  // await loadServerEnv(options);

  const serverBaseOptions = options;

  // const serverCliConfig = loadServerCliConfig(options.pwd, options.config);

  // if (serverCliConfig) {
  //   options.config = serverCliConfig;
  // }

  // const serverRuntimeConfig = await loadServerRuntimeConfig(
  //   options.serverConfigPath,
  // );

  // if (serverRuntimeConfig) {
  //   serverBaseOptions.serverConfig = serverRuntimeConfig;
  //   serverBaseOptions.plugins = [
  //     ...(serverRuntimeConfig.plugins || []),
  //     ...(options.plugins || []),
  //   ];
  // }
  const server = createServerBase<BaseEnv>(serverBaseOptions);

  await applyPlugins(server, options, undefined);
  await server.init();
  return (request: Request, context: unknown) => {
    return server.handle(request, context);
  };
};
