import type {
  AsyncPipeline,
  AsyncSetup,
  AsyncWaterfall,
  AsyncWorkflow,
  CommonAPI,
  ParallelWorkflow,
  PluginOptions,
} from '@modern-js/plugin';
import type {
  AfterMatchContext,
  AfterRenderContext,
  AfterStreamingRenderContext,
  ISAppContext,
  UnstableMiddleware,
} from '@modern-js/types';
import type { MiddlewareHandler } from 'hono';
import type {
  APIServerStartInput,
  FallbackInput,
  ResetEvent,
  ServerConfig,
  WebAdapter,
  WebServerStartInput,
} from './base';

export interface ServerHooks {
  config: AsyncWaterfall<ServerConfig>;

  prepare: AsyncWaterfall<void>;

  reset: AsyncWorkflow<{ event: ResetEvent }, void>;

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

export type ServerPluginAPI = {
  setAppContext: (c: ISAppContext) => void;
  useAppContext: () => ISAppContext;
  useConfigContext: () => ServerConfig;
};

export type PluginAPI = ServerPluginAPI & CommonAPI<ServerHooks>;

/**old server plugin. */
export type ServerPlugin = PluginOptions<
  ServerHooks,
  AsyncSetup<ServerHooks, PluginAPI>
>;
