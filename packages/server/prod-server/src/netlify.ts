import {
  loadServerCliConfig,
  loadServerEnv,
} from '@modern-js/server-core/node';
import { createServerBase } from '@modern-js/server-core';
import { BaseEnv, ProdServerOptions } from './types';
import { applyPlugins } from './apply';

export type { ProdServerOptions, BaseEnv } from './types';

export const createNetlifyFunction = async (options: ProdServerOptions) => {
  const serverCliConfig = loadServerCliConfig(options.pwd, options.config);

  if (serverCliConfig) {
    options.config = serverCliConfig;
  }

  const server = createServerBase<BaseEnv>(options);

  await loadServerEnv(options);
  await applyPlugins(server, options);
  await server.init();
  return (request: Request, context: unknown) => {
    return server.handle(request, context);
  };
};
