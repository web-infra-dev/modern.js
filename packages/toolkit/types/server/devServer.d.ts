import type { IncomingMessage, ServerResponse } from 'http';
import type { NextFunction, BffProxyOptions } from './utils';

export type DevServerHttpsOptions = boolean | { key: string; cert: string };

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => void;

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
    writeToDisk: boolean | ((filename: string) => boolean);
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
