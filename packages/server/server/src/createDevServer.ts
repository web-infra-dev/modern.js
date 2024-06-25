import { Server as NodeServer } from 'node:http';
import path from 'node:path';
import { ServerBaseOptions, createServerBase } from '@modern-js/server-core';
import {
  createNodeServer,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';
import { ApplyPlugins, ModernDevServerOptions } from './types';
import { getDevOptions } from './helpers';
import { devPlugin } from './dev';

export type { ModernDevServerOptions } from './types';

export const createDevServer = async <O extends ServerBaseOptions>(
  options: ModernDevServerOptions<O>,
  applyPlugins: ApplyPlugins<O>,
): Promise<NodeServer> => {
  const { config, pwd, serverConfigFile, serverConfigPath } = options;
  const dev = getDevOptions(options);

  const distDir = path.resolve(pwd, config.output.path || 'dist');

  const serverConfig = loadServerRuntimeConfig(
    distDir,
    serverConfigFile,
    serverConfigPath,
  );

  const prodServerOptions = {
    ...options,
    pwd: distDir, // server base pwd must distDir,
  };

  if (serverConfig) {
    prodServerOptions.serverConfig = serverConfig;
  }

  const server = createServerBase(prodServerOptions);

  const devHttpsOption = typeof dev === 'object' && dev.https;
  let nodeServer;
  if (devHttpsOption) {
    const { genHttpsOptions } = await import('./dev-tools/https');
    const httpsOptions = await genHttpsOptions(devHttpsOption, pwd);
    nodeServer = await createNodeServer(
      server.handle.bind(server),
      httpsOptions,
    );
  } else {
    nodeServer = await createNodeServer(server.handle.bind(server));
  }

  server.addPlugins([devPlugin(options)]);

  await applyPlugins(server, prodServerOptions, nodeServer);

  await server.init();

  return nodeServer;
};
