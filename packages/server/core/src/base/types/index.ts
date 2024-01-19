import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import type {
  Metrics,
  Logger,
  NextFunction,
  ModernServerContext,
  InternalPlugins,
  Reporter,
  BaseSSRServerContext,
  ServerRoute,
} from '@modern-js/types';
import { Logger as LocalLogger } from '@modern-js/utils/logger';
import { ServerOptions } from '@config/index';
import { ServerPlugin, serverManager } from '@core/plugin';
import { HonoContext, HonoEnv, NotFoundHandler } from './hono';

declare module 'http' {
  interface IncomingMessage {
    logger: Logger;
    metrics: Metrics;
    reporter?: Reporter;
    body?: any;
  }

  interface OutgoingMessage {
    set: (key: string, value: any) => this;
    modernFlushedHeaders?: boolean;
  }
}

export type ServerCoreOptions = {
  app: ServerInstance;
  pwd: string;
  // Todo 整理下这里用的 config，尽量少用
  routes?: ServerRoute[];
  config: ServerOptions;
  metaName?: string;
  plugins?: ServerPlugin[];
  internalPlugins?: InternalPlugins;
  staticGenerate?: boolean;
  logger?: LocalLogger;
  metrics?: Metrics;
  apiOnly?: boolean;
  ssrOnly?: boolean;
  webOnly?: boolean;
  runMode?: string;
  appContext?: {
    appDirectory?: string;
    sharedDirectory: string;
    apiDirectory: string;
    lambdaDirectory: string;
    metaName: string;
  };
  serverConfigFile?: string;
  proxyTarget?: any;
};

export type SSRServerContext = BaseSSRServerContext & {
  staticGenerate?: boolean;
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

export type { Metrics, Logger, NextFunction };

export type HookNames = 'afterMatch' | 'afterRender';

export interface ModernServerInterface {
  pwd: string;

  distDir: string;

  onInit: (runner: ServerHookRunner, app: Server) => Promise<void>;

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

  render: (
    req: IncomingMessage,
    res: ServerResponse,
    url?: string,
  ) => Promise<string | Readable | null>;

  close?: () => Promise<void>;
}

export type ServerConstructor = (
  options: ServerCoreOptions,
) => ModernServerInterface;

export type ModernServerHandler = (
  context: ModernServerContext,
  next: NextFunction,
) => Promise<void> | void;

export type Middleware<Env extends HonoEnv = any> = (
  ctx: HonoContext<Env>,
  next: () => Promise<void>,
) => void | Response | Promise<void | Response>;

export interface ServerInstance<Env extends HonoEnv = any> {
  use: (middleware: Middleware<Env>) => void;
  get: (path: string, middleware: Middleware<Env>) => void;
  post: (path: string, middleware: Middleware<Env>) => void;
  all: (path: string, middleware: Middleware<Env>) => void;
  request: (input: RequestInfo | URL) => Response | Promise<Response>;
  notFound: (handler: NotFoundHandler<Env>) => void;
  handle: RequestHandler;
}

export type RequestHandler = (
  request: Request,
  ...args: any[]
) => Response | Promise<Response>;

export * from './hono';
