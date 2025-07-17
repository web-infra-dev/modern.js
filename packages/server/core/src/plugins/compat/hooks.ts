import type { InternalServerContext, ResetEvent } from '@modern-js/plugin';
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

export function transformHookRunner(hookRunnerName: string) {
  switch (hookRunnerName) {
    case 'config':
      return 'modifyConfig';
    case 'prepare':
      return 'onPrepare';
    case 'reset':
      return 'onReset';
    default:
      return hookRunnerName;
  }
}
export function handleSetupResult(
  setupResult: Record<string, (...args: any) => any>,
  api: Record<string, any>,
) {
  if (!setupResult) {
    return;
  }
  Object.keys(setupResult).forEach(key => {
    const fn = setupResult[key];
    if (typeof fn === 'function') {
      const newAPI = transformHookRunner(key);
      if (api[newAPI]) {
        api[newAPI]((...params: any) => {
          const res = fn(...params);
          return res;
        });
      }
    }
  });
}
