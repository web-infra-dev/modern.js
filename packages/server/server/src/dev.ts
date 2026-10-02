import type { Server as NodeServer } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import type { Server as NodeHttpsServer } from 'node:https';
import type { BuilderInstance, Rspack } from '@modern-js/builder';
import type {
  FileChangeEvent,
  ServerBase,
  ServerBaseOptions,
  ServerPlugin,
} from '@modern-js/server-core';
import { connectMid2HonoMid } from '@modern-js/server-core/node';
import type { RequestHandler } from '@modern-js/types';
import { API_DIR, SHARED_DIR, logger } from '@modern-js/utils';
import type { WatchEvent } from './dev-tools/watcher';
import {
  getDevOptions,
  getMockMiddleware,
  initFileReader,
  isPathInsideDirectory,
  onRepack,
  resolveMockDirectory,
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

      const mockMiddleware = await getMockMiddleware(
        pwd,
        options.config?.dev?.mockDir,
      );

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
  /**
   * Triggered when a watched user server file changes (require cache already
   * busted). Wired to the runtime reload scheduler.
   */
  onFileChange: (filepath: string, event: WatchEvent) => void;
  /**
   * Extra teardown run as part of the dev server close chain (e.g. stopping the
   * reload scheduler so a pending debounced reload can't rebuild after close).
   */
  onClose?: () => void;
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
  onFileChange,
  onClose,
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
  // Mock files keep their original semantics: they refresh via the runtime
  // reload (which re-runs getMockMiddleware) and were NEVER part of the
  // `onReset` file-change signal pre-refactor, so they stay excluded here to
  // keep `onReset`'s emission byte-identical to the old watcher behavior.
  const mockDir = config.dev?.mockDir;
  const mockPath = resolveMockDirectory(pwd, mockDir);
  const watcher = startWatcher({
    pwd,
    distDir,
    apiDir: apiDir || API_DIR,
    sharedDir: sharedDir || SHARED_DIR,
    mockDir,
    watchOptions,
    onChange: (filepath, event) => {
      // Re-emit the public `file-change` onReset signal on the LIVE runtime
      // (via getRuntimeServer, never a stale closure), preserving the exact
      // pre-refactor emission. `onReset` is a documented ServerPlugin hook;
      // downstream plugins (internal/external/EdenX) legitimately tap it for
      // their own dev refresh — e.g. EdenX gulu/gulux restart their BFF child
      // process on it. No-op for modern.js's own plugins. The unified runtime
      // reload below is the modern.js reaction and is unchanged.
      const runtimeServer = getRuntimeServer();
      if (runtimeServer && !isPathInsideDirectory(filepath, mockPath)) {
        const fileChangeEvent: FileChangeEvent = {
          type: 'file-change',
          payload: [{ filename: filepath, event }],
        };
        Promise.resolve(
          runtimeServer.hooks.onReset.call({ event: fileChangeEvent }),
        ).catch(error => logger.error(error as Error));
      }
      onFileChange(filepath, event);
    },
  });
  closeCb.push(watcher.close.bind(watcher));

  // Stop the reload scheduler last, so any pending debounced reload is
  // cancelled and no rebuild can run after the watcher / builder dev server
  // have been closed.
  onClose && closeCb.push(onClose);

  const close$ = () => {
    closeCb.forEach(cb => {
      cb();
    });
  };

  closeCb.length > 0 && nodeServer?.on('close', close$);

  return { close: close$ };
}
