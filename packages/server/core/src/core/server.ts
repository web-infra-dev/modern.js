import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { Readable } from 'node:stream';
import type {
  Metrics,
  Logger,
  NextFunction,
  ModernServerContext,
  InternalPlugins,
  Reporter,
  BaseSSRServerContext,
  ServerRoute,
  NestedRoute,
} from '@modern-js/types';
import { MiddlewareHandler } from 'hono';
import { ServerOptions } from '../types/config/index';
import { ServerHookRunner, ServerPlugin } from './plugin';
import { HonoEnv } from './hono';

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
  /** server working directory, and then also dist directory */
  pwd: string;
  config: ServerOptions;
  serverConfigFile?: string;
  routes?: ServerRoute[];
  plugins?: ServerPlugin[];
  internalPlugins?: InternalPlugins;
  appContext: {
    appDirectory?: string;
    sharedDirectory?: string;
    apiDirectory?: string;
    lambdaDirectory?: string;
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

type ServerLoaderBundle = {
  routes: NestedRoute[];
  handleRequest: (options: {
    request: Request;
    serverRoutes: ServerRoute[];
    context: any;
    routes: NestedRoute[];
  }) => Promise<any>;
};

type ServerRenderBundle = {
  serverRender: () => any;
};

export type ServerManifest = {
  loaderBundles?: Record<string, ServerLoaderBundle>;
  renderBundles?: Record<string, ServerRenderBundle>;
  loadableStats?: Record<string, any>;
  routeManifest?: Record<string, any>;
};

type ServerVariables = {
  logger: Logger;
  reporter?: Reporter;
  serverManifest?: ServerManifest;
  metrics?: Metrics;
  templates?: Record<string, string>;
};

export type ServerEnv = {
  Variables: ServerVariables;
};

export * from './hono';
