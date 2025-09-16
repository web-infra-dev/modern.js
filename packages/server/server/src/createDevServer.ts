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
import serverHmrPlugin from './plugins/serverReload';
import type { ApplyPlugins, ModernDevServerOptions } from './types';

export let serverReload: (() => Promise<void>) | null = null;

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

  let currentServer = createServerBase(prodServerOptions);

  let isReloading = false;

  const devHttpsOption = typeof dev === 'object' && dev.https;
  const isHttp2 = !!devHttpsOption;

  let nodeServer: Awaited<ReturnType<typeof createNodeServer>>;
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
    isReloading = true;

    try {
      await currentServer.close();

      const updatedProdServerOptions = await createServerOptions(
        options,
        serverConfigPath,
        distDir,
      );
      const newServer = createServerBase(updatedProdServerOptions);

      await manager.close(ResourceType.Watcher);

      newServer.addPlugins([serverHmrPlugin(), devPlugin(options, true)]);
      await applyPlugins(newServer, updatedProdServerOptions);
      await newServer.init();

      currentServer = newServer;

      logger.info(`Custom Web Server reload succeeded`);
    } catch (e) {
      logger.error('[Custom Web Server reload failed]:', e);
    } finally {
      isReloading = false;
    }
  };
  serverReload = reload;
  currentServer.addPlugins([
    serverHmrPlugin(),
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

  await applyPlugins(currentServer, prodServerOptions, nodeServer);

  await currentServer.init();

  const afterListen = async () => {
    await builderDevServer?.afterListen();
  };

  return {
    server: nodeServer,
    afterListen,
  };
}
