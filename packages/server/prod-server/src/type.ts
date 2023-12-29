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
  InternalPlugins,
  Reporter,
} from '@modern-js/types';
import { Logger as LocalLogger } from '@modern-js/utils/logger';
import type { ModernRouteInterface } from './libs/route';

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

export type ModernServerOptions = {
  pwd: string;
  // Todo 整理下这里用的 config，尽量少用
  config: ServerOptions;
  plugins?: ServerPlugin[];
  internalPlugins?: InternalPlugins;
  routes?: ModernRouteInterface[];
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

  render: (
    req: IncomingMessage,
    res: ServerResponse,
    url?: string,
  ) => Promise<string | Readable | null>;

  close?: () => Promise<void>;
}

export type ServerConstructor = (
  options: ModernServerOptions,
) => ModernServerInterface;

export type ModernServerHandler = (
  context: ModernServerContext,
  next: NextFunction,
) => Promise<void> | void;
