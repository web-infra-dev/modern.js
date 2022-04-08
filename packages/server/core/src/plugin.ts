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
import { enable } from '@modern-js/plugin/node';
import type {
  ModernServerContext,
  BaseSSRServerContext,
  Metrics,
  Logger,
} from '@modern-js/types/server';
import type { NormalizedConfig, UserConfig } from '@modern-js/core';
import type { ISAppContext } from '@modern-js/types';
import type { Options } from 'http-proxy-middleware';

enable();

// collect all middleware register in server plugins
const gather = createParallelWorkflow<{
  addWebMiddleware: (_input: any) => void;
  addAPIMiddleware: (_input: any) => void;
}>();

type ServerInitInput = {
  loggerOptions: any;
  metricsOptions: any;
};

type InitExtension = {
  logger: Logger;
  metrics: Metrics;
};

// config
const config = createWaterfall<ServerConfig>();

const create = createAsyncPipeline<ServerInitInput, InitExtension>();

export type Adapter = (
  req: IncomingMessage,
  res: ServerResponse,
) => void | Promise<void>;

export type WebServerStartInput = {
  pwd: string;
  config: Record<string, any>;
};

const prepareWebServer = createAsyncPipeline<WebServerStartInput, Adapter>();

export type APIServerStartInput = {
  pwd: string;
  mode: 'function' | 'framework';
  prefix?: string;
  config?: {
    middleware?: Array<any>;
  };
};
const prepareApiServer = createAsyncPipeline<APIServerStartInput, Adapter>();

const beforeDevServer = createParallelWorkflow<NormalizedConfig, any>();

const setupCompiler = createParallelWorkflow<Record<string, unknown>, any[]>();

const afterDevServer = createParallelWorkflow<NormalizedConfig, any>();

// TODO FIXME
export type Route = Record<string, unknown>;
const beforeRouteSet = createAsyncPipeline<Route[], Route[]>();

const afterRouteSet = createAsyncPipeline();

const preServerInit = createParallelWorkflow<NormalizedConfig, any>();

const postServerInit = createParallelWorkflow<NormalizedConfig, any>();

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

const afterMatch = createAsyncPipeline<
  { context: ModernServerContext; routeAPI: any },
  any
>();

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

const afterRender = createAsyncPipeline<
  { context: ModernServerContext; templateAPI: any },
  any
>();

const beforeSend = createAsyncPipeline<ModernServerContext, RequestResult>();

const afterSend = createParallelWorkflow<{
  context: ModernServerContext;
}>();

const reset = createParallelWorkflow();

export const AppContext = createContext<ISAppContext>({} as ISAppContext);

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
};

const serverHooks = {
  // server hook
  gather,
  config,
  create,
  prepareWebServer,
  prepareApiServer,
  beforeDevServer,
  setupCompiler,
  afterDevServer,
  beforeRouteSet,
  afterRouteSet,
  preServerInit,
  postServerInit,
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
