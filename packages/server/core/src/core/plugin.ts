import { Readable } from 'stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Component } from 'react';
import {
  CommonAPI,
  ToThreads,
  AsyncSetup,
  PluginOptions,
  createContext,
  createAsyncManager,
  createAsyncPipeline,
  createAsyncWaterfall,
  createParallelWorkflow,
  createWaterfall,
  ToRunners,
} from '@modern-js/plugin';
import type {
  ModernServerContext,
  BaseSSRServerContext,
  AfterMatchContext,
  AfterRenderContext,
  MiddlewareContext,
  ISAppContext,
  ServerRoute,
  HttpMethodDecider,
  ServerInitHookContext,
  AfterStreamingRenderContext,
} from '@modern-js/types';

// TODO: should not import hono
import type { MiddlewareHandler } from 'hono';
import type { BffUserConfig, ServerOptions, UserConfig } from '../types/config';

// collect all middleware register in server plugins
const gather = createParallelWorkflow<{
  addWebMiddleware: (_input: any) => void;
  addAPIMiddleware: (_input: any) => void;
}>();

// config
const config = createWaterfall<ServerConfig>();

const prepare = createWaterfall();

export type WebAdapter = (ctx: MiddlewareContext) => void | Promise<void>;

export type NodeRequest = IncomingMessage;
export type NodeResponse = ServerResponse;

export type Adapter = (
  req: NodeRequest,
  res: NodeResponse,
) => void | Promise<void>;

export type WebServerStartInput = {
  pwd: string;
  config: Record<string, any>;
};

export type LoaderHandler = (context: ModernServerContext) => Promise<void>;

const prepareLoaderHandler = createAsyncPipeline<
  {
    serverRoutes: ServerRoute[];
    distDir: string;
  },
  LoaderHandler
>();

const prepareWebServer = createAsyncPipeline<
  WebServerStartInput,
  WebAdapter | null
>();

export type APIServerStartInput = {
  pwd: string;
  prefix?: string;
  httpMethodDecider?: HttpMethodDecider;
  config?: {
    middleware?: Array<any>;
  };
  render?: (
    req: IncomingMessage,
    res: ServerResponse,
    url?: string,
  ) => Promise<string | Readable | null>;
};

type Change = {
  filename: string;
  event: 'add' | 'change' | 'unlink';
};

const prepareApiServer = createAsyncPipeline<
  APIServerStartInput,
  MiddlewareHandler
>();

const onApiChange = createAsyncWaterfall<Change[]>();

const repack = createWaterfall();

/**
 * @deprecated
 */
const beforeServerInit = createAsyncWaterfall<ServerInitHookContext>();

const setupCompiler = createParallelWorkflow<Record<string, unknown>, any[]>();

// TODO FIXME
export type Route = Record<string, unknown>;
const beforeRouteSet = createAsyncPipeline<Route[], Route[]>();

const afterRouteSet = createAsyncPipeline();

const beforeProdServer = createParallelWorkflow<ServerOptions, any>();

const afterProdServer = createParallelWorkflow<ServerOptions, any>();

const listen = createParallelWorkflow<
  {
    ip: string;
    port: number;
  },
  any[]
>();

const beforeServerReset = createParallelWorkflow();

const afterServerReset = createParallelWorkflow();

const extendSSRContext = createAsyncWaterfall<BaseSSRServerContext>();

const extendContext = createAsyncPipeline<
  ModernServerContext,
  ModernServerContext
>();

const handleError = createParallelWorkflow<{ error: Error }>();

export type RequestResult = { isfinish: boolean };
const beforeMatch = createAsyncPipeline<
  { context: ModernServerContext },
  any
>();

const afterMatch = createAsyncPipeline<AfterMatchContext, any>();

// TODO FIXME
export type SSRServerContext = Record<string, unknown>;
const prefetch = createParallelWorkflow<{
  context: SSRServerContext;
}>();

// TODO FIXME
export type RenderContext = Record<string, unknown>;
const renderToString = createAsyncPipeline<
  { App: Component; context: RenderContext },
  string
>();

const beforeRender = createAsyncPipeline<
  { context: ModernServerContext },
  any
>();

const afterRender = createAsyncPipeline<AfterRenderContext, any>();

const afterStreamingRender = createAsyncPipeline<
  AfterStreamingRenderContext,
  string
>();

const beforeSend = createAsyncPipeline<ModernServerContext, RequestResult>();

const afterSend = createParallelWorkflow<{
  context: ModernServerContext;
}>();

const reset = createParallelWorkflow();

export const AppContext = createContext<ISAppContext>({} as ISAppContext);

export const setAppContext = (value: ISAppContext) => AppContext.set(value);

export const ConfigContext = createContext<UserConfig>({} as UserConfig);

/**
 * Get original content of user config.
 */
export const useConfigContext = () => ConfigContext.use().value;

/**
 * Get app context, including directories, plugins and some static infos.
 */
export const useAppContext = () => AppContext.use().value;

const pluginAPI = {
  useAppContext,
  useConfigContext,
  setAppContext,
};

const serverHooks = {
  // server hook
  gather,
  config,
  prepare,
  prepareLoaderHandler,
  prepareWebServer,
  prepareApiServer,
  repack,
  onApiChange,
  beforeServerInit,
  setupCompiler,
  beforeRouteSet,
  afterRouteSet,
  beforeProdServer,
  afterProdServer,
  listen,
  beforeServerReset,
  afterServerReset,
  // request hook
  extendSSRContext,
  extendContext,
  handleError,
  beforeMatch,
  afterMatch,
  prefetch,
  renderToString,
  beforeRender,
  afterRender,
  afterStreamingRender,
  beforeSend,
  afterSend,
  reset,
};

/** All hooks of server plugin. */
export type ServerHooks = typeof serverHooks;

/** All hook callbacks of server plugin. */
export type ServerHookCallbacks = ToThreads<ServerHooks>;

/** The ServerHook Runner type */
export type ServerHookRunner = ToRunners<ServerHooks>;

/** All apis for server plugin. */
export type PluginAPI = typeof pluginAPI & CommonAPI<ServerHooks>;

export const createServerManager = () =>
  createAsyncManager(serverHooks, pluginAPI);

export const serverManager = createServerManager();

/** Plugin options of a server plugin. */
export type ServerPlugin = PluginOptions<
  ServerHooks,
  AsyncSetup<ServerHooks, PluginAPI>
>;

export type ServerConfig = {
  bff?: BffUserConfig;
  plugins?: ServerPlugin[];
};

export const { createPlugin } = serverManager;
