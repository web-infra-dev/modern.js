import { Buffer } from 'buffer';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { Readable } from 'stream';
import { serverManager, ServerOptions } from '@modern-js/server-core';
import type { ServerPlugin } from '@modern-js/server-core';
import type {
  Metrics,
  Logger,
  NextFunction,
  ModernServerContext,
} from '@modern-js/types';
import type { ModernRouteInterface } from './libs/route';

declare module 'http' {
  interface IncomingMessage {
    logger: Logger;
    metrics: Metrics;
  }
}

type Plugin = string | [string, any] | ServerPlugin;
export type ModernServerOptions = {
  pwd: string;
  config: ServerOptions;
  plugins?: Plugin[];
  routes?: ModernRouteInterface[];
  staticGenerate?: boolean;
  logger?: Logger;
  metrics?: Metrics;
  apiOnly?: boolean;
  ssrOnly?: boolean;
  webOnly?: boolean;
  proxyTarget?: {
    ssr?: string;
    api?: string;
  };
  runMode?: string;
  [propName: string]: any;
};

export type RenderResult = {
  content: string | Buffer;
  contentType: string;
  contentStream?: Readable;
  statusCode?: number;
  redirect?: boolean;
};

export type ConfWithBFF = {
  bff?: {
    prefix: string;
  } & ServerOptions['bff'];
};

export type Then<T> = T extends PromiseLike<infer U> ? U : T;

export type ServerHookRunner = Then<ReturnType<typeof serverManager.init>>;

export type BuildOptions = { routes?: ModernRouteInterface[] };

export type { Metrics, Logger, NextFunction };

export type HookNames = 'afterMatch' | 'afterRender';

export interface ModernServerInterface {
  pwd: string;

  distDir: string;

  onInit: (runner: ServerHookRunner, app: Server) => Promise<void>;

  onRepack: (options: BuildOptions) => void;

  getRequestHandler: () => (
    req: IncomingMessage,
    res: ServerResponse,
    next?: () => void,
  ) => void;

  createHTTPServer: (
    handler: (
      req: IncomingMessage,
      res: ServerResponse,
      next?: () => void,
    ) => void,
  ) => Promise<Server>;
}

export type ServerConstructor = (
  options: ModernServerOptions,
) => ModernServerInterface;

export type ModernServerHandler = (
  context: ModernServerContext,
  next: NextFunction,
) => Promise<void> | void;
