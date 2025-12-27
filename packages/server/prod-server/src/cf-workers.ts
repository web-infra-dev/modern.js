import { createServerBase } from '@modern-js/server-core';
import { getServerCliConfig, loadDeps } from '@modern-js/server-core/edge';
import { OUTPUT_CONFIG_FILE } from '@modern-js/utils';
import { applyPlugins } from './apply/edge';
import type { BaseEnv, ProdServerOptions } from './types';

export type { ProdServerOptions, BaseEnv } from './types';

export const createCFWorkersFunction = async (
  options: ProdServerOptions,
  env?: any,
) => {
  const serverBaseOptions = options;
  const deps = options.appContext.appDependencies;

  const serverCliConfig = getServerCliConfig(
    options.config,
    await loadDeps(OUTPUT_CONFIG_FILE, deps),
  );

  if (serverCliConfig) {
    options.config = serverCliConfig;
  }

  const serverRuntimeConfig = await loadDeps(options.serverConfigPath, deps);

  if (serverRuntimeConfig) {
    serverBaseOptions.serverConfig = serverRuntimeConfig;
    serverBaseOptions.plugins = [
      ...(serverRuntimeConfig.plugins || []),
      ...(options.plugins || []),
    ];
  }
  const server = createServerBase<BaseEnv>(serverBaseOptions);

  const cache = await caches.open('MODERN_SERVER_CACHE');

  await applyPlugins(server, options, cache, env);
  await server.init();
  return (request: any, env: any, ctx: any) => {
    return server.handle(request, env, ctx);
  };
};
