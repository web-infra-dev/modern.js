import type { Server as NodeServer } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import type { Server as NodeHttpsServer } from 'node:https';
import type { BuilderInstance, Rspack } from '@modern-js/builder';
import type {
  ServerBase,
  ServerBaseOptions,
  ServerPlugin,
} from '@modern-js/server-core';
import { connectMid2HonoMid } from '@modern-js/server-core/node';
import type { RequestHandler } from '@modern-js/types';
import { API_DIR, SHARED_DIR } from '@modern-js/utils';
import {
  getDevOptions,
  getMockMiddleware,
  initFileReader,
  onRepack,
  startWatcher,
} from './helpers';
import type { ModernDevServerOptions } from './types';

type BuilderDevServer = Awaited<ReturnType<BuilderInstance['createDevServer']>>;

export type DevPluginOptions = ModernDevServerOptions<ServerBaseOptions> & {
  builderDevServer?: BuilderDevServer;
};

/**
 * Runtime-level dev middleware injection.
 *
 * This plugin is added to EVERY runtime `ServerBase` that `buildRuntimeServer`
 * creates, so it must be safe to run repeatedly and must NOT touch any
 * process-level resource (the file watcher / websocket / builder hooks / close
 * callbacks all live in `setupDevInfra`). It only pushes request middlewares
 * into the current server's middleware list:
 * - user `dev.setupMiddlewares` (before / after)
 * - the mock middleware
 * - the rsbuild/builder dev middleware (a stable reference, just re-registered)
 * - the file-reader middleware
 */
export const devRuntimeMiddlewarePlugin = (
  options: DevPluginOptions,
  compiler: Rspack.Compiler | Rspack.MultiCompiler | null,
): ServerPlugin => ({
  name: '@modern-js/plugin-dev',

  setup(api) {
    const { pwd, builderDevServer } = options;

    const dev = getDevOptions(options.dev);

    api.onPrepare(async () => {
      const { middlewares: builderMiddlewares } = builderDevServer || {};

      const { middlewares } = api.getServerContext();

      // Handle setupMiddlewares
      const before: RequestHandler[] = [];
      const after: RequestHandler[] = [];
      const { setupMiddlewares = [] } = dev;
      setupMiddlewares.forEach(handler => {
        handler(
          {
            unshift: (...handlers) => before.unshift(...handlers),
            push: (...handlers) => after.push(...handlers),
          },
          {
            sockWrite: () => {
              // ignore
            },
          },
        );
      });

      before.forEach((middleware, index) => {
        middlewares.push({
          name: `before-dev-server-${index}`,
          handler: connectMid2HonoMid(middleware),
        });
      });

      const mockMiddleware = await getMockMiddleware(pwd);

      middlewares.push({
        name: 'mock-dev',
        handler: mockMiddleware,
      });

      builderMiddlewares &&
        middlewares.push({
          name: 'rsbuild-dev',
          handler: connectMid2HonoMid(builderMiddlewares as any),
        });

      after.forEach((middleware, index) => {
        middlewares.push({
          name: `after-dev-server-${index}`,
          handler: connectMid2HonoMid(middleware),
        });
      });

      middlewares.push({
        name: 'init-file-reader',
        handler: initFileReader(compiler),
      });
    });
  },
});

export interface DevInfraOptions {
  config: DevPluginOptions['config'];
  pwd: string;
  distDir: string;
  apiDir?: string;
  sharedDir?: string;
  builder?: BuilderInstance;
  builderDevServer?: BuilderDevServer;
  compiler: Rspack.Compiler | Rspack.MultiCompiler | null;
  nodeServer?: NodeServer | NodeHttpsServer | Http2SecureServer;
  /** Accessor for the currently-active runtime ServerBase (a mutable ref). */
  getRuntimeServer: () => ServerBase | undefined;
}

export interface DevInfra {
  /** Tear down every process-level resource. Called when the dev server stops. */
  close: () => void;
}

/**
 * Process-level dev infrastructure, created EXACTLY ONCE for the lifetime of
 * the dev server. None of these resources are recreated or torn down by a
 * runtime hot reload:
 * - the rsbuild/builder dev server websocket connection
 * - the builder `onDevCompileDone` -> SSR cache reset hook
 * - the file watcher
 * - close callbacks registered on the Node server's `close` event
 *
 * The watcher / onRepack reach the LIVE runtime hooks through
 * `getRuntimeServer()` (a mutable ref) instead of closing over the initial
 * runtime, so a later phase can swap the trigger to the reload scheduler
 * without leaking a stale closure to a dead runtime.
 */
export function setupDevInfra({
  config,
  pwd,
  distDir,
  apiDir,
  sharedDir,
  builder,
  builderDevServer,
  getRuntimeServer,
  nodeServer,
}: DevInfraOptions): DevInfra {
  const { close, connectWebSocket } = builderDevServer || {};

  const closeCb: Array<(...args: []) => any> = [];

  close && closeCb.push(close);

  connectWebSocket && nodeServer && connectWebSocket({ server: nodeServer });

  // Handle server bundle rebuild: reset SSR cache against the live runtime.
  builder?.onDevCompileDone(({ stats }) => {
    if (stats.toJson({ all: false }).name !== 'server') {
      const runtimeServer = getRuntimeServer();
      if (runtimeServer) {
        onRepack(distDir, runtimeServer.hooks);
      }
    }
  });

  // Handle watch
  const { watchOptions } = config.server;
  const watcher = startWatcher({
    pwd,
    distDir,
    apiDir: apiDir || API_DIR,
    sharedDir: sharedDir || SHARED_DIR,
    watchOptions,
    getServer: getRuntimeServer,
  });
  closeCb.push(watcher.close.bind(watcher));

  const close$ = () => {
    closeCb.forEach(cb => {
      cb();
    });
  };

  closeCb.length > 0 && nodeServer?.on('close', close$);

  return { close: close$ };
}
