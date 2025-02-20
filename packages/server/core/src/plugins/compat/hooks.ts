import type { InternalServerContext, ResetEvent } from '@modern-js/plugin-v2';
import type {
  AfterMatchContext,
  AfterRenderContext,
  AfterStreamingRenderContext,
} from '@modern-js/types';
import type {
  APIServerStartInput,
  FallbackInput,
  ServerConfig,
  ServerPluginExtends,
  WebServerStartInput,
} from '../../types';
/**
 * old plugin useHookRunners function result
 */
export function getHookRunners(
  context: InternalServerContext<ServerPluginExtends>,
): Record<string, any> {
  const { hooks } = context;
  return {
    config: (params: ServerConfig) => {
      return hooks.modifyConfig.call(params);
    },
    prepare: () => {
      return hooks.onPrepare.call();
    },
    reset: (params: {
      event: ResetEvent;
    }) => {
      return hooks.onReset.call(params);
    },
    fallback: (input: FallbackInput) => {
      return hooks.fallback.call(input);
    },
    prepareWebServer: (input: WebServerStartInput) => {
      return hooks.prepareWebServer.call(input);
    },
    prepareApiServer: (input: APIServerStartInput) => {
      return hooks.prepareApiServer.call(input);
    },
    afterMatch: (ctx: AfterMatchContext) => {
      return hooks.afterMatch.call(ctx);
    },
    afterRender: (ctx: AfterRenderContext) => {
      return hooks.afterRender.call(ctx);
    },
    afterStreamingRender: (ctx: AfterStreamingRenderContext) => {
      return hooks.afterStreamingRender.call(ctx);
    },
  };
}
