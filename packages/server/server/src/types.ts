import type { IncomingMessage, ServerResponse } from 'http';
import type {
  DevServerOptions,
  DevServerHttpsOptions,
  NextFunction,
} from '@modern-js/types';
import type { ModernServerOptions } from '@modern-js/prod-server';

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
  /** To ensure HMR works, the devMiddleware need inject the hmr client path into page. */
  hmrClientPath: string;

  /** The options need by sub middleware (like webpackMiddleware) */
  headers?: Record<string, string>;
  writeToDisk?: boolean | ((filename: string) => boolean);
  stats?: boolean;

  /** should trigger when compiler hook called */
  callbacks: MiddlewareCallbacks;
};

/**
 * TODO: check
 * The modern/server do nothing about compiler, the devMiddleware need do such things to ensure dev works well:
 * - call compiler.watch （normally did by webpack-dev-middleware）.
 * - inject the hmr client path into page （the hmr client modern/server already provide）.
 * - Notify server when compiler hooks are triggered.
 */
export type DevMiddleware = (options: DevMiddlewareOptions) => DevMiddlewareAPI;

export type ExtraOptions = {
  dev: boolean | Partial<DevServerOptions>;
  devMiddleware?: DevMiddleware;
};

export type ModernDevServerOptions = ModernServerOptions & ExtraOptions;
