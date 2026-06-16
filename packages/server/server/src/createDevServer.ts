import path from 'node:path';
import type { Rspack } from '@modern-js/builder';
import { type ServerBase, createServerBase } from '@modern-js/server-core';
import {
  createNodeServer,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';
import { devRuntimeMiddlewarePlugin, setupDevInfra } from './dev';
import {
  type ReloadableHandle,
  createReloadManager,
} from './dev-tools/reloadManager';
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

  /**
   * Process-level resources, created EXACTLY ONCE. A runtime hot reload never
   * recreates or tears these down: the Rspack compiler reference, the builder
   * dev server (with its HMR / websocket / dev middleware), and the Node server
   * itself (set up further below).
   */
  let compiler: Rspack.Compiler | Rspack.MultiCompiler | null = null;

  builder?.onAfterCreateCompiler(context => {
    compiler = context.compiler;
  });

  const assetPrefixPromise = getDevAssetPrefix(builder);

  const builderDevServer = await builder?.createDevServer({
    runCompile: options.runCompile,
  });

  /**
   * The currently-active runtime ServerBase. Process-level infra (the file
   * watcher / SSR-cache reset) reaches the live hooks through this mutable ref
   * instead of closing over a single runtime instance.
   */
  let currentRuntimeServer: ServerBase | undefined;

  let nodeServer: Awaited<ReturnType<typeof createNodeServer>> | undefined;

  /**
   * Build a brand-new runtime ServerBase and return its request handle.
   *
   * Used for the initial boot AND every hot reload, so there is exactly one
   * definition of "what a runtime server contains". It creates NO process-level
   * resource — the watcher / websocket / builderDevServer / close callbacks are
   * owned by `setupDevInfra` and survive reloads untouched.
   *
   * A fresh options object is spread per build so a stray append can never leak
   * across builds; every plugin is re-applied onto a brand-new ServerBase.
   */
  const buildRuntimeServer = async (): Promise<ReloadableHandle> => {
    const runtimeServer = createServerBase({ ...prodServerOptions });
    runtimeServer.addPlugins([
      devRuntimeMiddlewarePlugin({ ...options, builderDevServer }, compiler),
    ]);
    await applyPlugins(runtimeServer, prodServerOptions, nodeServer);
    await runtimeServer.init();
    currentRuntimeServer = runtimeServer;
    return runtimeServer.handle;
  };

  const reloadManager = createReloadManager({
    build: buildRuntimeServer,
  });

  /**
   * Node server / HTTPS / WebSocket layer: created once. Every request is
   * forwarded through the ReloadManager to the latest runtime handle, so a
   * runtime reload can atomically swap the whole runtime without recreating
   * the Node server.
   */
  const devHttpsOption = typeof dev === 'object' && dev.https;
  const isHttp2 = !!devHttpsOption;
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

  // run after createDevServer, we can get assetPrefix from builder
  const assetPrefix = await assetPrefixPromise;
  if (assetPrefix) {
    prodServerOptions.config.output.assetPrefix = assetPrefix;
  }

  /**
   * Initial runtime build. Done explicitly (not through the ReloadManager) so a
   * boot failure propagates instead of being swallowed as "keep the previous
   * handle". The resulting handle seeds the ReloadManager.
   */
  reloadManager.setHandle(await buildRuntimeServer());

  /**
   * Process-level dev infra, created once. The watcher / onRepack reach the
   * live runtime via `getRuntimeServer` (a mutable ref) and a later phase will
   * swap the trigger to `reloadManager.schedule()`.
   */
  setupDevInfra({
    config,
    pwd,
    distDir,
    apiDir: options.appContext?.apiDirectory,
    sharedDir: options.appContext?.sharedDirectory,
    builder,
    builderDevServer,
    compiler,
    nodeServer,
    getRuntimeServer: () => currentRuntimeServer,
  });

  const afterListen = async () => {
    await builderDevServer?.afterListen();
  };

  return {
    server: nodeServer,
    afterListen,
  };
}
