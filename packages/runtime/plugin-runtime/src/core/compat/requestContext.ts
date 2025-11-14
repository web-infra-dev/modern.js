import type { BaseSSRServerContext } from '@modern-js/types';
// this plugin is use to provide request context to runtime context
import type { TRuntimeContext } from '../context';
import type { RuntimePlugin } from '../plugin/types';

export const makeRequestContext = (context: TRuntimeContext) => {
  const baseSSRContext = context.ssrContext;
  const requestContext = baseSSRContext
    ? {
        isBrowser: context.isBrowser,
        request:
          baseSSRContext.request || ({} as BaseSSRServerContext['request']),
        response:
          baseSSRContext.response || ({} as BaseSSRServerContext['response']),
        logger: baseSSRContext.logger || ({} as BaseSSRServerContext['logger']),
      }
    : {};

  return requestContext;
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
