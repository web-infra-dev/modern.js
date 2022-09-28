import type { IncomingMessage, ServerResponse } from 'http';
import type { Compiler, MultiCompiler } from 'webpack';
import type { BffProxyOptions, NextFunction } from './utils';

export type DevServerHttpsOptions = boolean | { key: string; cert: string };

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => void;

type WriteToDisk = boolean | ((filename: string) => boolean);

type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => Promise<void>;

export type DevMiddlewareAPI = Middleware & {
  close: (callback: (err: Error | null | undefined) => void) => any;
};

export type DevServerOptions = {
  /** config of hmr client. */
  client?: {
    path?: string;
    port?: string;
    host?: string;
    logging?: string;
    overlay?: boolean;
    progress?: boolean;
  };
  devMiddleware?: {
    writeToDisk: WriteToDisk;
    /** custom dev middleware */
    provider?: (
      compiler: MultiCompiler | Compiler,
      options: {
        headers?: Record<string, string>;
        writeToDisk?: WriteToDisk;
        stats?: boolean;
      },
    ) => DevMiddlewareAPI;
  };
  proxy?: BffProxyOptions;
  headers?: Record<string, string>;
  before?: RequestHandler[];
  after?: RequestHandler[];
  /** Whether to watch files change. */
  watch?: boolean;
  /** Whether to enable hot reload. */
  hot?: boolean | string;
  /** Whether to enable page reload. */
  liveReload?: boolean;
  /** Whether to enable https. */
  https?: DevServerHttpsOptions;
  [propName: string]: any;
};
