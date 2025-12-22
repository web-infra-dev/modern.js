import { createServerBase } from '@modern-js/server-core';
import {
  getServerCliConfig,
  loadDeps,
} from '@modern-js/server-core/edge-function';
import { OUTPUT_CONFIG_FILE } from '@modern-js/utils';
import { applyPlugins } from './apply/edge-function';
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
  deps: any,
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

  await applyPlugins(server, options, deps);
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
