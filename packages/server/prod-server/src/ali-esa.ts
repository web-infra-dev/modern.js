import { createServerBase } from '@modern-js/server-core';
import { getServerCliConfig, loadDeps } from '@modern-js/server-core/edge';
import { OUTPUT_CONFIG_FILE } from '@modern-js/utils';
import { applyPlugins } from './apply/edge';
import type { BaseEnv, ProdServerOptions } from './types';

declare const cache: Cache;

export type { BaseEnv, ProdServerOptions } from './types';

export const createAliESAFunction = async (
  options: ProdServerOptions,
  env: any,
) => {
  const deps = options.appContext.appDependencies;
  const serverBaseOptions = options;

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

  await applyPlugins(server, options, cache, env);
  await server.init();
  return (request: Request) => {
    return server.handle(request, env);
  };
};
