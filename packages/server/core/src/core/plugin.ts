import type { IncomingMessage, ServerResponse } from 'node:http';
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
  AfterMatchContext,
  AfterRenderContext,
  MiddlewareContext,
  ISAppContext,
  HttpMethodDecider,
  ServerInitHookContext,
  AfterStreamingRenderContext,
} from '@modern-js/types';

import type { BffUserConfig, UserConfig } from '../types/config';
import { HonoMiddleware } from './hono';
import { Render } from './render';

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
  render?: Render | null;
};

type Change = {
  filename: string;
  event: 'add' | 'change' | 'unlink';
};

const prepareApiServer = createAsyncPipeline<
  APIServerStartInput,
  HonoMiddleware
>();

const onApiChange = createAsyncWaterfall<Change[]>();

const repack = createWaterfall();

/**
 * @deprecated
 */
const beforeServerInit = createAsyncWaterfall<ServerInitHookContext>();

// TODO FIXME
export type Route = Record<string, unknown>;

export type RequestResult = { isfinish: boolean };

const afterMatch = createAsyncPipeline<AfterMatchContext, any>();

// TODO FIXME
export type SSRServerContext = Record<string, unknown>;

// TODO FIXME
export type RenderContext = Record<string, unknown>;

const afterRender = createAsyncPipeline<AfterRenderContext, any>();

const afterStreamingRender = createAsyncPipeline<
  AfterStreamingRenderContext,
  string
>();

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
  prepareWebServer,
  prepareApiServer,
  repack,
  onApiChange,
  beforeServerInit,
  afterMatch,
  afterRender,
  afterStreamingRender,
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
