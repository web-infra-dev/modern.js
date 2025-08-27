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
import serverHmrPlugin from './plugins/serverHmr';
import type { ApplyPlugins, ModernDevServerOptions } from './types';

async function createServerOptions(
  options: ModernDevServerOptions,
  serverConfigPath: string,
  distDir: string,
) {
  const serverConfig = (await loadServerRuntimeConfig(serverConfigPath)) || {};

  return {
    ...options,
    pwd: distDir,
    serverConfig: {
      ...serverConfig,
      ...options.serverConfig,
    },
    plugins: [...(serverConfig.plugins || []), ...(options.plugins || [])],
  };
}

export async function createDevServer(
  options: ModernDevServerOptions,
  applyPlugins: ApplyPlugins,
) {
  const { config, pwd, serverConfigPath, builder } = options;
  const dev = getDevOptions(options.dev);

  const distDir = path.resolve(pwd, config.output.distPath?.root || 'dist');

  const prodServerOptions = await createServerOptions(
    options,
    serverConfigPath,
    distDir,
  );

  const server = createServerBase(prodServerOptions);
  let currentServer = server;
  let isReloading = false;

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

  const reload = async () => {
    if (isReloading) {
      return;
    }
    try {
      isReloading = true;

      const updatedProdServerOptions = await createServerOptions(
        options,
        serverConfigPath,
        distDir,
      );
      const newServer = createServerBase(updatedProdServerOptions);

      await manager.close(ResourceType.Watcher);

      newServer.addPlugins([
        serverHmrPlugin(reload),
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
    } finally {
      isReloading = false;
    }
  };

  server.addPlugins([
    serverHmrPlugin(reload),
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

  return {
    server: nodeServer,
    afterListen,
  };
}
