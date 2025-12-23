import { createServerBase } from '@modern-js/server-core';
import {
  getServerCliConfig,
  loadDeps,
} from '@modern-js/server-core/edge-function';
import { OUTPUT_CONFIG_FILE } from '@modern-js/utils';
import { applyPlugins } from './apply/edge-function';
import type { BaseEnv, ProdServerOptions } from './types';

export type { ProdServerOptions, BaseEnv } from './types';

export const createCFWorkersFunction = async (
  options: ProdServerOptions,
  deps: any,
  env?: any,
) => {
  const serverBaseOptions = options;

  const serverCliConfig = getServerCliConfig(
    options.config,
    loadDeps(OUTPUT_CONFIG_FILE, deps)?.content,
  );

  if (serverCliConfig) {
    options.config = serverCliConfig;
  }

  const serverRuntimeConfig = loadDeps(options.serverConfigPath, deps)?.content;

  if (serverRuntimeConfig) {
    serverBaseOptions.serverConfig = serverRuntimeConfig;
    serverBaseOptions.plugins = [
      ...(serverRuntimeConfig.plugins || []),
      ...(options.plugins || []),
    ];
  }
  const server = createServerBase<BaseEnv>(serverBaseOptions);

  const cache = await caches.open('MODERN_SERVER_CACHE');

  await applyPlugins(server, options, deps, cache, env);
  await server.init();
  return (request: any, env: any, ctx: any) => {
    return server.handle(request, env, ctx);
  };
};
