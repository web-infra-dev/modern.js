import path from 'node:path';
import type { Rspack } from '@modern-js/builder';
import { createServerBase } from '@modern-js/server-core';
import {
  createNodeServer,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';
import { devPlugin } from './dev';
import { createReloadManager } from './dev-tools/reloadManager';
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

  /**
   * Stable request handle indirection.
   *
   * The Node server (and its HTTPS / WebSocket / Rsbuild dev middleware layer)
   * is created exactly once. Every request is forwarded through the
   * ReloadManager to the latest runtime handle, so a future runtime reload can
   * atomically swap the whole server runtime without recreating the Node
   * server. On a failed reload the previous handle keeps serving.
   *
   * NOTE (phase 1): the `build` callback and the file-change trigger that calls
   * `reloadManager.schedule()` are wired in a later phase. For now nothing
   * invokes a reload, so behavior is identical to binding `server.handle`
   * directly — only one extra forwarding call is added per request.
   */
  const reloadManager = createReloadManager({
    initialHandle: server.handle,
    build: async () => {
      throw new Error(
        '[dev-server] runtime reload is not wired yet (pending later phase)',
      );
    },
  });

  const devHttpsOption = typeof dev === 'object' && dev.https;
  const isHttp2 = !!devHttpsOption;
  let nodeServer;
  if (devHttpsOption) {
    const { genHttpsOptions } = await import('./dev-tools/https');
    const httpsOptions = await genHttpsOptions(devHttpsOption, pwd);
    nodeServer = await createNodeServer(
      reloadManager.handle,
      httpsOptions,
      isHttp2,
    );
  } else {
    nodeServer = await createNodeServer(reloadManager.handle);
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
