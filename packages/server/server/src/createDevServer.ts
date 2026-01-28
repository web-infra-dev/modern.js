import path from 'node:path';
import type { Rspack } from '@modern-js/builder';
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

  const devHttpsOption = typeof dev === 'object' && dev.https;
  const isHttp2 = !!devHttpsOption;
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

  let compiler: Rspack.Compiler | Rspack.MultiCompiler | null = null;

  builder?.onAfterCreateCompiler(context => {
    compiler = context.compiler;
  });

  const builderDevServer = await builder?.createDevServer({
    runCompile: options.runCompile,
  });

  server.addPlugins([
    devPlugin(
      {
        ...options,
        builderDevServer,
      },
      compiler,
    ),
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
