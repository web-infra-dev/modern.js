/** Hooks */
import type {
  Server as NodeServer,
  IncomingMessage,
  ServerResponse,
} from 'http';
import {
  AsyncWaterfall,
  ParallelWorkflow,
  ToRunners,
  ToThreads,
  CommonAPI,
  PluginOptions,
  AsyncSetup,
  createContext,
  AsyncPipeline,
} from '@modern-js/plugin';
import {
  AfterMatchContext,
  AfterRenderContext,
  AfterStreamingRenderContext,
  HttpMethodDecider,
  ISAppContext,
  Logger,
  Metrics,
  MiddlewareContext,
  Reporter,
  ServerRoute,
  UnstableMiddleware,
} from '@modern-js/types';
import { MiddlewareHandler } from 'hono';
import { BffUserConfig, UserConfig } from './config';
import { Render } from './render';

export type ChangeEvent = 'add' | 'change' | 'unlink';

export interface Change {
  filename: string;
  event: ChangeEvent;
}

export interface RepackEvent {
  type: 'repack';
}

export interface FileChangeEvent {
  type: 'file-change';
  payload: Change[];
}

export type ResetEvent = RepackEvent | FileChangeEvent;

export type FallbackReason = 'error' | 'header' | 'query';

type FallbackInput = {
  reason: FallbackReason;
  error: unknown;
  logger: Logger;
  metrics?: Metrics;
  reporter?: Reporter;
};

export type APIServerStartInput = {
  pwd: string;
  prefix?: string;
  httpMethodDecider?: HttpMethodDecider;
  config?: {
    middleware?: Array<any>;
  };
  render?: Render | null;
};

export type WebServerStartInput = {
  pwd: string;
  config: Record<string, any>;
};

export type WebAdapter = (ctx: MiddlewareContext) => void | Promise<void>;

export interface ServerHooks {
  config: AsyncWaterfall<ServerConfig>;
  prepare: AsyncWaterfall<void>;
  reset: ParallelWorkflow<{ event: ResetEvent }>;

  /** @deprecated  */
  prepareWebServer: AsyncPipeline<
    WebServerStartInput,
    WebAdapter | Array<UnstableMiddleware> | null
  >;

  /** @deprecated  */
  fallback: ParallelWorkflow<FallbackInput>;

  /** @deprecated  */
  prepareApiServer: AsyncPipeline<APIServerStartInput, MiddlewareHandler>;

  /** @deprecated  */
  afterMatch: AsyncPipeline<AfterMatchContext, any>;

  /** @deprecated  */
  afterRender: AsyncPipeline<AfterRenderContext, any>;

  /** @deprecated  */
  afterStreamingRender: AsyncPipeline<AfterStreamingRenderContext, string>;
}

export type ServerHookCallback = ToThreads<ServerHooks>;

/** Plugin Api */

type Middleware = {
  name: string;

  path?: string;

  method?: 'options' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'all';

  handler: MiddlewareHandler | MiddlewareHandler[];

  before?: Middleware['name'];
};

declare module '@modern-js/types' {
  export interface ISAppContext {
    middlewares: Middleware[];
    metaName: string;
    routes?: ServerRoute[];
    nodeServer?: NodeServer;
  }
}
export type NodeRequest = IncomingMessage;
export type NodeResponse = ServerResponse;

export { NodeServer };

export type AppContext = ReturnType<typeof createContext<ISAppContext>>;
export type ConfigContext = ReturnType<typeof createContext<UserConfig>>;

export type ServerPluginAPI = {
  setAppContext: (c: ISAppContext) => void;
  useAppContext: () => ISAppContext;
  useConfigContext: () => UserConfig;
};

export type PluginAPI = ServerPluginAPI & CommonAPI<ServerHooks>;

/** Runner */
export type ServerHookRunner = ToRunners<ServerHooks>;

/** Plugin options of a server plugin. */
export type ServerPlugin = PluginOptions<
  ServerHooks,
  AsyncSetup<ServerHooks, PluginAPI>
>;

export interface ServerConfig {
  bff?: BffUserConfig;
  plugins?: ServerPlugin[];
}
