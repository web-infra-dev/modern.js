import { IncomingMessage, ServerResponse } from 'http';
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
} from '@modern-js/plugin';
import type {
  ModernServerContext,
  BaseSSRServerContext,
  AfterMatchContext,
  AfterRenderContext,
  MiddlewareContext,
  ISAppContext,
  ServerRoute,
} from '@modern-js/types';
import type { Options } from 'http-proxy-middleware';
import type { ServerOptions, UserConfig } from './types/config';

// collect all middleware register in server plugins
const gather = createParallelWorkflow<{
  addWebMiddleware: (_input: any) => void;
  addAPIMiddleware: (_input: any) => void;
}>();

// config
const config = createWaterfall<ServerConfig>();

const prepare = createWaterfall();

export type WebAdapter = (ctx: MiddlewareContext) => void | Promise<void>;

export type Adapter = (
  req: IncomingMessage,
  res: ServerResponse,
) => void | Promise<void>;

export type WebServerStartInput = {
  pwd: string;
  config: Record<string, any>;
};

export type BeforeRouteHandler = (
  context: ModernServerContext,
) => Promise<void>;

const preparebeforeRouteHandler = createAsyncPipeline<
  {
    serverRoutes: ServerRoute[];
    distDir: string;
  },
  BeforeRouteHandler
>();

const prepareWebServer = createAsyncPipeline<WebServerStartInput, WebAdapter>();

export type APIServerStartInput = {
  pwd: string;
  prefix?: string;
  config?: {
    middleware?: Array<any>;
  };
};

type Change = {
  filename: string;
  event: 'add' | 'change' | 'unlink';
};

const prepareApiServer = createAsyncPipeline<APIServerStartInput, Adapter>();

const onApiChange = createWaterfall<Change[]>();

const beforeDevServer = createParallelWorkflow<ServerOptions, any>();

const setupCompiler = createParallelWorkflow<Record<string, unknown>, any[]>();

const afterDevServer = createParallelWorkflow<ServerOptions, any>();

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
  preparebeforeRouteHandler,
  prepareWebServer,
  prepareApiServer,
  onApiChange,
  beforeDevServer,
  setupCompiler,
  afterDevServer,
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
  beforeSend,
  afterSend,
  reset,
};

/** All hooks of server plugin. */
export type ServerHooks = typeof serverHooks;

/** All hook callbacks of server plugin. */
export type ServerHookCallbacks = ToThreads<ServerHooks>;

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
  bff?: Partial<{
    proxy: Record<string, Options>;
  }>;
  plugins?: ServerPlugin[];
};

export const { createPlugin } = serverManager;
