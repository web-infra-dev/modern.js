import { Buffer } from 'buffer';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { serverManager } from '@modern-js/server-core';
import type { ServerPlugin } from '@modern-js/server-core';
import type { NormalizedConfig } from '@modern-js/core';
import type { Metrics, Logger, NextFunction } from '@modern-js/types/server';
import { ModernRouteInterface } from './libs/route';

declare module 'http' {
  interface IncomingMessage {
    logger: Logger;
    metrics: Metrics;
  }
}

type Plugin = string | [string, any] | ServerPlugin;
export type ModernServerOptions = {
  pwd: string;
  config: NormalizedConfig;
  plugins?: Plugin[];
  routes?: ModernRouteInterface[];
  staticGenerate?: boolean;
  loggerOptions?: Record<string, string>;
  metricsOptions?: Record<string, string>;
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
  statusCode?: number;
  redirect?: boolean;
};

export type ConfWithBFF = {
  bff?: {
    prefix: string;
  };
} & NormalizedConfig;

export type Then<T> = T extends PromiseLike<infer U> ? U : T;

export type ServerHookRunner = Then<ReturnType<typeof serverManager.init>>;

export type BuildOptions = { routes?: ModernRouteInterface[] };

export type { Metrics, Logger, NextFunction };

export type HookNames =
  | 'beforeMatch'
  | 'afterMatch'
  | 'beforeRender'
  | 'afterRender';

export interface ModernServerInterface {
  pwd: string;

  distDir: string;

  onInit: (runner: ServerHookRunner) => Promise<void>;

  onClose: () => Promise<void>;

  onRepack: (options: BuildOptions) => void;

  onListening: (app: Server) => void;

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
