import { createServerBase } from '@modern-js/server-core';
import {
  getServerCliConfig,
  loadDeps,
  serverStaticPlugin,
} from '@modern-js/server-core/edge-function';
import { OUTPUT_CONFIG_FILE } from '@modern-js/utils';
import { applyPlugins } from './apply/edge-function';
import type { BaseEnv, ProdServerOptions } from './types';

export type { BaseEnv, ProdServerOptions } from './types';

interface EdgeOneEventContext {
  request: Request;
  params: Record<string, string>;
  env: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
}

export const createEdgeOneFunction = async (
  options: ProdServerOptions,
  deps: any,
  staticFiles: string[],
  env?: Record<string, unknown>,
) => {
  const serverBaseOptions = options;

  const serverCliConfig = getServerCliConfig(
    options.config,
    loadDeps([OUTPUT_CONFIG_FILE], deps)?.content,
  );

  if (serverCliConfig) {
    options.config = serverCliConfig;
  }

  const serverRuntimeConfig = loadDeps(
    options.serverConfigPath.split('/'),
    deps,
  )?.content;

  if (serverRuntimeConfig) {
    serverBaseOptions.serverConfig = serverRuntimeConfig;
    serverBaseOptions.plugins = [
      ...(serverRuntimeConfig.plugins || []),
      ...(options.plugins || []),
    ];
  }
  const server = createServerBase<BaseEnv>(serverBaseOptions);

  const staticPlugin = serverStaticPlugin(staticFiles);

  await applyPlugins(server, options, deps, env, [staticPlugin]);
  await server.init();
  return (ctx: EdgeOneEventContext) => {
    return server.handle(
      ctx.request,
      {
        Bindings: {},
        Variables: ctx.env,
      },
      {
        waitUntil: ctx.waitUntil,
        passThroughOnException: () => {},
        props: {}
      },
    );
  };
};
