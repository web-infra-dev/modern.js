import { createServerBase } from '@modern-js/server-core';
import {
  loadBundledServerCliConfig,
  loadBundledServerRuntimeConfig,
  loadServerCliConfig,
  loadServerEnv,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';
import { type ExtraApplyConfig, applyPlugins } from './apply';
import type { BaseEnv, ProdServerOptions } from './types';

export const createBaseProdServer = async (options: ProdServerOptions) => {
  // load env file.
  if (!process.env.MODERN_SERVER_BUNDLE) {
    await loadServerEnv(options);
  }

  const serverBaseOptions = options;

  let serverCliConfig = options.config;
  if (process.env.NODE_ENV === 'production') {
    if (process.env.MODERN_SERVER_BUNDLE) {
      serverCliConfig = await loadBundledServerCliConfig(
        options.config,
        options.appContext.dependencies,
      );
    } else {
      serverCliConfig = await loadServerCliConfig(options.pwd, options.config);
    }
  }

  if (serverCliConfig) {
    serverBaseOptions.config = serverCliConfig;
  }

  let serverRuntimeConfig;
  if (process.env.MODERN_SERVER_BUNDLE) {
    serverRuntimeConfig = await loadBundledServerRuntimeConfig(
      options.serverConfigPath,
    );
  } else {
    serverRuntimeConfig = await loadServerRuntimeConfig(
      options.serverConfigPath,
    );
  }

  if (serverRuntimeConfig) {
    serverBaseOptions.serverConfig = serverRuntimeConfig;
    serverBaseOptions.plugins = [
      ...(serverRuntimeConfig.plugins || []),
      ...(options.plugins || []),
    ];
  }

  const server = createServerBase<BaseEnv>(serverBaseOptions);

  return {
    server,
    init: async (extra?: ExtraApplyConfig) => {
      await applyPlugins(server, options, extra);
      await server.init();
    },
  };
};
