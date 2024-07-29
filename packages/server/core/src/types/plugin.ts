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
  CacheOption,
  Container,
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
import { UserConfig } from './config';
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

  /**
   * @deprecated
   *
   * deprecate it next major version
   * */
  prepareWebServer: AsyncPipeline<
    WebServerStartInput,
    WebAdapter | Array<UnstableMiddleware> | null
  >;

  /**
   * @deprecated
   *
   * deprecate it when server runtime entry refactor
   *
   */
  fallback: ParallelWorkflow<FallbackInput>;

  /**
   * @deprecated
   *
   * deprecate it next major version
   */
  prepareApiServer: AsyncPipeline<APIServerStartInput, MiddlewareHandler>;

  /**
   * @deprecated
   *
   * deprecate it next major version
   */
  afterMatch: AsyncPipeline<AfterMatchContext, any>;

  /**
   * @deprecated
   *
   * deprecate it next major version
   */
  afterRender: AsyncPipeline<AfterRenderContext, any>;

  /**
   * @deprecated
   *
   * deprecate it next major version
   * */
  afterStreamingRender: AsyncPipeline<AfterStreamingRenderContext, string>;
}

export type ServerHookCallback = ToThreads<ServerHooks>;

/** Plugin Api */

type MiddlewareOrder = 'pre' | 'post' | 'default';

type Middleware = {
  name: string;

  path?: string;

  method?: 'options' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'all';

  handler: MiddlewareHandler | MiddlewareHandler[];

  before?: Array<Middleware['name']>;

  order?: MiddlewareOrder;
};

declare module '@modern-js/types' {
  export interface ISAppContext {
    middlewares: Middleware[];
    metaName: string;
    render?: Render;
    routes?: ServerRoute[];
    nodeServer?: NodeServer;
  }
}
export type NodeRequest = IncomingMessage;
export type NodeResponse = ServerResponse;

export { NodeServer };

export type AppContext = ReturnType<typeof createContext<ISAppContext>>;
export type ConfigContext = ReturnType<typeof createContext<ServerConfig>>;

export type ServerPluginAPI = {
  setAppContext: (c: ISAppContext) => void;
  useAppContext: () => ISAppContext;
  useConfigContext: () => ServerConfig;
};

export type PluginAPI = ServerPluginAPI & CommonAPI<ServerHooks>;

/** Runner */
export type ServerHookRunner = ToRunners<ServerHooks>;

/** Plugin options of a server plugin. */
export type ServerPlugin = PluginOptions<
  ServerHooks,
  AsyncSetup<ServerHooks, PluginAPI>
>;

export type CacheConfig = {
  strategy: CacheOption;
  container?: Container;
};

type RenderMiddleware = UnstableMiddleware;

export interface RenderConfig {
  cache?: CacheConfig;
  middleware?: RenderMiddleware[];
}

export type ServerConfig = {
  render?: RenderConfig;
  plugins?: ServerPlugin[];
} & UserConfig;
