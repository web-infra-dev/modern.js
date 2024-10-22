import path from 'node:path';
import { createServerBase } from '@modern-js/server-core';
import {
  createNodeServer,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';
import { devPlugin } from './dev';
import { getDevOptions } from './helpers';
import type { ApplyPlugins, ModernDevServerOptions } from './types';

export async function createDevServer(
  options: ModernDevServerOptions,
  applyPlugins: ApplyPlugins,
) {
  const { config, pwd, serverConfigFile, serverConfigPath, builder } = options;
  const dev = getDevOptions(options);

  const distDir = path.resolve(pwd, config.output.distPath?.root || 'dist');

  const serverConfig = await loadServerRuntimeConfig(
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

  const builderDevServer = await builder?.createDevServer({
    runCompile: options.runCompile,
    compiler: options.compilier,
  });

  server.addPlugins([
    devPlugin({
      ...options,
      builderDevServer,
    }),
  ]);

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
