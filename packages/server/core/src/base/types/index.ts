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
import { ServerOptions } from '@config/index';
import { ServerPlugin, serverManager } from '@core/plugin';
import { MiddlewareHandler } from 'hono';
import { HonoContext, HonoEnv, HonoNodeEnv } from './hono';

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

export type ServerBaseOptions = {
  pwd: string;
  config: ServerOptions;
  serverConfigFile?: string;
  routes?: ServerRoute[];
  plugins?: ServerPlugin[];
  internalPlugins?: InternalPlugins;
  appContext: {
    sharedDirectory?: string;
    apiDirectory: string;
    lambdaDirectory: string;
  };
  runMode?: 'apiOnly' | 'ssrOnly' | 'webOnly';
};

export type SSRServerContext = BaseSSRServerContext & {
  staticGenerate?: boolean;
};

export type ServerRender = (
  ssrContext: SSRServerContext,
) => Promise<string | Readable | ReadableStream>;

export type RenderResult = {
  // eslint-disable-next-line node/prefer-global/buffer
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
  options: ServerBaseOptions,
) => ModernServerInterface;

export type ModernServerHandler = (
  context: ModernServerContext,
  next: NextFunction,
) => Promise<void> | void;

export type Middleware<Env extends HonoEnv = any> = MiddlewareHandler<Env>;

export type RequestHandler = (
  request: Request,
  ...args: any[]
) => Response | Promise<Response>;

export type ServerNodeMiddleware = Middleware<HonoNodeEnv>;
export type ServerNodeContext = HonoContext<HonoNodeEnv>;

export * from './hono';
