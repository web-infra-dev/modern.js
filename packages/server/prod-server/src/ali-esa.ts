import { createServerBase } from '@modern-js/server-core';
import {
  getServerCliConfig,
  loadDeps,
} from '@modern-js/server-core/edge-function';
import { OUTPUT_CONFIG_FILE } from '@modern-js/utils';
import { applyPlugins } from './apply/edge-function';
import type { BaseEnv, ProdServerOptions } from './types';

declare const cache: Cache;

export type { BaseEnv, ProdServerOptions } from './types';

export const createAliESAFunction = async (
  options: ProdServerOptions,
  env: any,
) => {
  const deps = options.appContext.appDependencies || {};
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

  await applyPlugins(server, options, cache, env);
  await server.init();
  return (request: Request) => {
    return server.handle(request, env);
  };
};
