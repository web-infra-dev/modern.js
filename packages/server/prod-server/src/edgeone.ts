import { createServerBase } from '@modern-js/server-core';
import {
  getServerCliConfig,
  loadDeps,
  serverStaticPlugin,
} from '@modern-js/server-core/edge';
import { OUTPUT_CONFIG_FILE } from '@modern-js/utils';
import { applyPlugins } from './apply/edge';
import type { BaseEnv, ProdServerOptions } from './types';

export type { ProdServerOptions, BaseEnv } from './types';

interface EOEventContext {
  uuid: string;
  params: any;
  request: Request;
  env: Record<string, unknown>;
  clientIp: string;
  server: {
    region: string;
    requestId: string;
  };
  geo: any;
}

export const createEdgeOneFunction = async (
  options: ProdServerOptions,
  staticFiles: string[],
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

  const staticPlugin = serverStaticPlugin(staticFiles);

  await applyPlugins(server, options, undefined, env, [staticPlugin]);
  await server.init();
  return (ctx: EOEventContext) => {
    return server.handle(ctx.request, {
      env: ctx.env,
      clientIp: ctx.clientIp,
      server: ctx.server,
      geo: ctx.geo,
    });
  };
};
