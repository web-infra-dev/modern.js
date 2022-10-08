import type { IncomingMessage, ServerResponse } from 'http';
import type webpack from 'webpack';
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

export type CustomDevMiddleware = (
  compiler: webpack.MultiCompiler | webpack.Compiler,
  options: {
    headers?: Record<string, string>;
    writeToDisk?: boolean | ((filename: string) => boolean);
    stats?: boolean;
  },
) => DevMiddlewareAPI;

export type ExtraOptions = {
  dev: boolean | Partial<DevServerOptions>;
  compiler: webpack.MultiCompiler | webpack.Compiler | null;
  devMiddleware?: CustomDevMiddleware;
};

export type ModernDevServerOptions = ModernServerOptions & ExtraOptions;
