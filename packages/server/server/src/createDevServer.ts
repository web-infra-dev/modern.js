import path from 'node:path';
import { createServerBase } from '@modern-js/server-core';
import {
  createNodeServer,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';
import { logger } from '@modern-js/utils';
import { devPlugin, manager } from './dev';
import { getDevAssetPrefix, getDevOptions } from './helpers';
import { ResourceType } from './helpers/utils';
import type { ApplyPlugins, ModernDevServerOptions } from './types';

export async function createDevServer(
  options: ModernDevServerOptions,
  applyPlugins: ApplyPlugins,
) {
  const { config, pwd, serverConfigPath, builder } = options;
  const dev = getDevOptions(options.dev);

  const distDir = path.resolve(pwd, config.output.distPath?.root || 'dist');

  const serverConfig = (await loadServerRuntimeConfig(serverConfigPath)) || {};

  const prodServerOptions = {
    ...options,
    pwd: distDir, // server base pwd must distDir,
    serverConfig: {
      ...serverConfig,
      ...options.serverConfig,
    },
    /**
     * 1. server plugins from modern.server.ts
     * 2. server plugins register by cli use _internalServerPlugins
     * Merge plugins, the plugins from modern.server.ts will run first
     */
    plugins: [...(serverConfig.plugins || []), ...(options.plugins || [])],
  };

  const server = createServerBase(prodServerOptions);
  let currentServer = server;

  const devHttpsOption = typeof dev === 'object' && dev.https;
  const isHttp2 = !!devHttpsOption;
  let nodeServer;
  if (devHttpsOption) {
    const { genHttpsOptions } = await import('./dev-tools/https');
    const httpsOptions = await genHttpsOptions(devHttpsOption, pwd);
    nodeServer = await createNodeServer(
      (req, res) => currentServer.handle(req, res),
      httpsOptions,
      isHttp2,
    );
  } else {
    nodeServer = await createNodeServer((req, res) =>
      currentServer.handle(req, res),
    );
  }

  const promise = getDevAssetPrefix(builder);
  const builderDevServer = await builder?.createDevServer({
    runCompile: options.runCompile,
    compiler: options.compiler,
  });

  server.addPlugins([
    devPlugin({
      ...options,
      builderDevServer,
    }),
  ]);

  // run after createDevServer, we can get assetPrefix from builder
  const assetPrefix = await promise;
  if (assetPrefix) {
    prodServerOptions.config.output.assetPrefix = assetPrefix;
  }

  await applyPlugins(server, prodServerOptions, nodeServer);

  await server.init();

  const afterListen = async () => {
    await builderDevServer?.afterListen();
  };

  const reload = async () => {
    try {
      const updatedServerConfig =
        (await loadServerRuntimeConfig(serverConfigPath)) || {};

      const updatedProdServerOptions = {
        ...options,
        pwd: distDir,
        serverConfig: {
          ...updatedServerConfig,
          ...options.serverConfig,
        },
        plugins: [
          ...(updatedServerConfig.plugins || []),
          ...(options.plugins || []),
        ],
      };

      const newServer = createServerBase(updatedProdServerOptions);

      await manager.close(ResourceType.Watcher);

      newServer.addPlugins([
        devPlugin({
          ...options,
        }),
      ]);

      await applyPlugins(newServer, updatedProdServerOptions, nodeServer);

      await newServer.init();

      currentServer = newServer;
      logger.info(`Custom Web Server HMR succeeded`);
    } catch (e) {
      logger.error('[Custom Web Server HMR failed]:', e);
    }
  };

  return {
    server: nodeServer,
    afterListen,
    reload,
  };
}
