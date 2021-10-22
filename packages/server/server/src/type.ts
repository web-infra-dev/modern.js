import { Buffer } from 'buffer';
import type Webpack from 'webpack';
import { serverManager } from '@modern-js/server-plugin';
import type { NormalizedConfig } from '@modern-js/core';
import type { Measure, Logger, NextFunction } from '@modern-js/types/server';
import { ModernRouteInterface } from './libs/route';

declare module '@modern-js/core' {
  interface UserConfig {
    bff: {
      proxy: Record<string, any>;
    };
  }
}

export type DevServerOptions = {
  // hmr client 配置
  client: {
    port: string;
    overlay: boolean;
    logging: string;
    path: string;
    host: string;
    progress?: boolean;
  };
  dev: {
    writeToDisk: boolean | ((filename: string) => boolean);
  };
  // 是否开启 hot reload
  hot: boolean | string;
  // 是否开启 page reload
  liveReload: boolean;
  // 是否开启 https
  https?: boolean | { key: string; cert: string };
  [propName: string]: any;
};

export type ModernServerOptions = {
  pwd: string;
  config: NormalizedConfig;
  plugins?: any[];
  dev?: boolean | DevServerOptions;
  compiler?: Webpack.MultiCompiler | Webpack.Compiler;
  routes?: ModernRouteInterface[];
  staticGenerate?: boolean;
  customServer?: boolean;
  loggerOptions?: Record<string, string>;
  measureOptions?: Record<string, string>;
  logger?: Logger;
  measure?: Measure;
  apiOnly?: boolean;
  webOnly?: boolean;
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

export type { Measure, Logger, NextFunction };
