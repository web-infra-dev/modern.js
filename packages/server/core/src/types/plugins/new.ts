import type {
  AsyncHook,
  AsyncPipelineHook,
  ServerContext as BaseServerContext,
  ServerPlugin as BaseServerPlugin,
  ServerPluginExtends as BaseServerPluginExtends,
} from '@modern-js/plugin-v2';
import type { Hooks } from '@modern-js/plugin-v2/server';
import type {
  AfterMatchContext,
  AfterRenderContext,
  AfterStreamingRenderContext,
  UnstableMiddleware,
} from '@modern-js/types';
import type { MiddlewareHandler } from 'hono';
import type { MiddlewareObj } from './base';
import type {
  APIServerStartInput,
  FallbackInput,
  ServerConfig,
  WebAdapter,
  WebServerStartInput,
} from './base';

export type FallbackFn = (input: FallbackInput) => Promise<FallbackInput>;
export type PrepareWebServerFn = (
  input: WebServerStartInput,
) => Promise<WebAdapter | Array<UnstableMiddleware> | null>;
export type PrepareApiServerFn = (
  input: APIServerStartInput,
) => Promise<MiddlewareHandler>;
export type AfterMatchFn = (ctx: AfterMatchContext) => Promise<any>;
export type AfterRenderFn = (ctx: AfterRenderContext) => Promise<any>;
export type AfterStreamingRenderContextFn = (
  ctx: AfterStreamingRenderContext,
) => Promise<AfterStreamingRenderContext>;

export interface ServerPluginExtends extends BaseServerPluginExtends {
  config: ServerConfig;
  extendContext: {
    middlewares: MiddlewareObj[];
    renderMiddlewares: MiddlewareObj[];
  };
  extendHooks: {
    prepareWebServer: AsyncPipelineHook<PrepareWebServerFn>;
    fallback: AsyncHook<FallbackFn>;
    prepareApiServer: AsyncPipelineHook<PrepareApiServerFn>;
    afterMatch: AsyncPipelineHook<AfterMatchFn>;
    afterRender: AsyncPipelineHook<AfterRenderFn>;
    afterStreamingRender: AsyncPipelineHook<AfterStreamingRenderContextFn>;
  };
}
export type ServerPlugin = BaseServerPlugin<ServerPluginExtends>;

export type ServerContext = BaseServerContext<ServerPluginExtends> &
  ServerPluginExtends['extendContext'];

export type ServerPluginHooks = Hooks<ServerPluginExtends> &
  ServerPluginExtends['extendHooks'];
