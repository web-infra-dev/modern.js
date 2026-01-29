import type { BaseSSRServerContext } from '@modern-js/types';
// this plugin is use to provide request context to runtime context
import type { TInternalRuntimeContext } from '../context';
import type { RuntimePlugin } from '../plugin/types';
import type { RequestContext } from '../types';

export const makeRequestContext = (
  context: TInternalRuntimeContext,
): RequestContext => {
  const baseSSRContext = context.ssrContext;
  if (baseSSRContext) {
    return {
      loaderContext: baseSSRContext.loaderContext,
      request: baseSSRContext.request,
      response: baseSSRContext.response,
    };
  }

  return {
    request: {} as BaseSSRServerContext['request'],
    response: {} as BaseSSRServerContext['response'],
  };
};

export const requestContextPlugin = (): RuntimePlugin => ({
  name: '@modern-js/runtime-plugin-request-context',

  setup(api) {
    api.onBeforeRender(context => {
      const requestContext = makeRequestContext(context);
      context.context = requestContext;
    });
  },
});
