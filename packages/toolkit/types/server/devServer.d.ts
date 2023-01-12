import type { IncomingMessage, ServerResponse } from 'http';
import type { NextFunction, BffProxyOptions } from './utils';

export type DevServerHttpsOptions = boolean | { key: string; cert: string };

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => void;

export type ExposeServerApis = {
  sockWrite: (
    type: string,
    data?: string | boolean | Record<string, any>,
  ) => void;
};

export type DevServerOptions = {
  /** config of hmr client. */
  client?: {
    path?: string;
    port?: string;
    host?: string;
    protocol?: string;
  };
  devMiddleware?: {
    writeToDisk: boolean | ((filename: string) => boolean);
  };
  proxy?: BffProxyOptions;
  headers?: Record<string, string>;
  before?: RequestHandler[];
  after?: RequestHandler[];
  /** Provides the ability to execute a custom function and apply custom middlewares */
  setupMiddlewares?: Array<
    (
      /** Order: `devServer.before` => `unshift` => internal middlewares => `push` => `devServer.after` */
      middlewares: {
        /** Use the `unshift` method if you want to run a middleware before all other middlewares */
        unshift: (...handlers: RequestHandler[]) => void;
        /** Use the `push` method if you want to run a middleware after all other middlewares */
        push: (...handlers: RequestHandler[]) => void;
      },
      server: ExposeServerApis,
    ) => void
  >;
  /** Whether to watch files change. */
  watch?: boolean;
  /** Whether to enable hot reload. */
  hot?: boolean | string;
  /** Whether to enable page reload. */
  liveReload?: boolean;
  /** Whether to enable https. */
  https?: DevServerHttpsOptions;
  /** see https://github.com/bripkens/connect-history-api-fallback */
  historyApiFallback?:
    | boolean
    | {
        index?: string;
        verbose?: boolean;
        logger?: typeof console.log;
        htmlAcceptHeaders?: string[];
        disableDotRule?: true;
        rewrites?: Array<{
          from: RegExp;
          to: string | RegExp | function;
        }>;
      };
  [propName: string]: any;
};
