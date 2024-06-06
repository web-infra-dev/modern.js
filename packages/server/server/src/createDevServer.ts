import { Server as NodeServer } from 'node:http';
import path from 'node:path';
import { ServerBaseOptions, createServerBase } from '@modern-js/server-core';
import {
  createNodeServer,
  loadServerConfig,
} from '@modern-js/server-core/node';
import { ApplyPlugins, ModernDevServerOptions } from './types';
import { getDevOptions } from './helpers';
import { devPlugin } from './dev';

export type { ModernDevServerOptions, InitProdMiddlewares } from './types';

export const createDevServer = async <O extends ServerBaseOptions>(
  options: ModernDevServerOptions<O>,
  applyPlugins: ApplyPlugins<O>,
): Promise<NodeServer> => {
  const { config, pwd, metaName, serverConfigFile } = options;
  const dev = getDevOptions(options);

  const distDir = path.resolve(pwd, config.output.path || 'dist');

  const serverConfig = loadServerConfig(distDir, metaName, serverConfigFile);

  const prodServerOptions = {
    ...options,
    pwd: distDir, // server base pwd must distDir,
    serverConfig,
  };

  const server = createServerBase(prodServerOptions);

  server.addPlugins([devPlugin(options)]);

  await applyPlugins(server, prodServerOptions);

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

  await server.init({ nodeServer });

  return nodeServer;
};
