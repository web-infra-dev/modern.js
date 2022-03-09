import { Buffer } from 'buffer';
import { serverManager } from '@modern-js/server-core';
import type { NormalizedConfig } from '@modern-js/core';
import type { Metrics, Logger, NextFunction } from '@modern-js/types/server';
import { ModernRouteInterface } from './libs/route';

declare module 'http' {
  interface IncomingMessage {
    logger: Logger;
    metrics: Metrics;
  }
}

declare module '@modern-js/core' {
  interface UserConfig {
    bff?: {
      proxy: Record<string, any>;
    };
  }
}

export type ModernServerOptions = {
  pwd: string;
  config: NormalizedConfig;
  plugins?: { pluginPath: string }[];
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

export type ReadyOptions = { routes?: ModernRouteInterface[] };

export type { Metrics, Logger, NextFunction };
