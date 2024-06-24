import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import type {
  DevServerOptions,
  DevServerHttpsOptions,
  NextFunction,
} from '@modern-js/types';
import type { RsbuildInstance } from '@rsbuild/core';

import {
  NodeServer,
  ServerBase,
  ServerBaseOptions,
} from '@modern-js/server-core';

export type { DevServerOptions, DevServerHttpsOptions };

type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => Promise<void>;

export type DevMiddlewareAPI = Middleware & {
  close: (callback: (err: Error | null | undefined) => void) => any;
};

export type MiddlewareCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
};

export type DevMiddlewareOptions = {
  /** To ensure HMR works, the devMiddleware need inject the hmr client path into page when HMR enable. */
  hmrClientPath?: string;

  /** The options need by compiler middleware (like webpackMiddleware) */
  headers?: Record<string, string | string[]>;
  writeToDisk?: boolean | ((filename: string) => boolean);
  stats?: boolean;

  /** should trigger when compiler hook called */
  callbacks: MiddlewareCallbacks;

  /** whether use Server Side Render */
  serverSideRender?: boolean;
};

/**
 * The modern/server do nothing about compiler, the devMiddleware need do such things to ensure dev works well:
 * - Call compiler.watch （normally did by webpack-dev-middleware）.
 * - Inject the hmr client path into page （the hmr client modern/server already provide）.
 * - Notify server when compiler hooks are triggered.
 */
export type DevMiddleware = (options: DevMiddlewareOptions) => DevMiddlewareAPI;

export type ExtraOptions = {
  dev: Pick<DevServerOptions, 'watch' | 'https'> & {
    writeToDisk?: boolean | ((filename: string) => boolean);
  };

  /** compat, the default value is modern.server-runtime.config.ts  */
  serverConfigFile?: string;

  serverConfigPath?: string;

  useSSRWorker?: boolean;

  rsbuild: RsbuildInstance;
  getMiddlewares?: () => {
    middlewares: (
      req: IncomingMessage,
      res: ServerResponse,
      next: NextFunction,
    ) => void;
    onHTTPUpgrade: (req: IncomingMessage, socket: Socket, head: any) => void;
    close: () => Promise<void>;
  };
};

export type ModernDevServerOptions<
  O extends ServerBaseOptions = ServerBaseOptions,
> = O & ExtraOptions;

export type ApplyPlugins<O extends ServerBaseOptions = ServerBaseOptions> = (
  server: ServerBase,
  options: O,
  nodeServer?: NodeServer,
) => Promise<void>;
