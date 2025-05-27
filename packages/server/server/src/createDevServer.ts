import path from 'node:path';
import { createServerBase } from '@modern-js/server-core';
import {
  createNodeServer,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';
import { devPlugin } from './dev';
import { getDevAssetPrefix, getDevOptions } from './helpers';
import type { ApplyPlugins, ModernDevServerOptions } from './types';

export async function createDevServer(
  options: ModernDevServerOptions,
  applyPlugins: ApplyPlugins,
) {
  const { config, pwd, serverConfigFile, serverConfigPath, builder, metaName } =
    options;
  const dev = getDevOptions(options);

  const distDir = path.resolve(pwd, config.output.distPath?.root || 'dist');

  const serverConfig =
    (await loadServerRuntimeConfig(
      distDir,
      serverConfigFile,
      serverConfigPath,
      metaName,
    )) || {};

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

  const devHttpsOption = typeof dev === 'object' && dev.https;
  const isHttp2 = devHttpsOption && typeof dev.proxy === 'undefined';
  let nodeServer;
  if (devHttpsOption) {
    const { genHttpsOptions } = await import('./dev-tools/https');
    const httpsOptions = await genHttpsOptions(devHttpsOption, pwd);
    nodeServer = await createNodeServer(
      server.handle.bind(server),
      httpsOptions,
      isHttp2,
    );
  } else {
    nodeServer = await createNodeServer(server.handle.bind(server));
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

  return {
    server: nodeServer,
    afterListen,
  };
}
