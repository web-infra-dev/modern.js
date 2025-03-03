// this plugin is use to provide request context to runtime context
import type { RuntimeContext } from '../context';
import type { RuntimePluginFuture } from '../plugin/types';
import type { TSSRContext } from '../types';

export const makeRequestContext = (context: RuntimeContext) => {
  const baseSSRContext = context.ssrContext;
  const requestContext = baseSSRContext
    ? {
        isBrowser: context.isBrowser,
        request: baseSSRContext.request || ({} as TSSRContext['request']),
        response: baseSSRContext.response || ({} as TSSRContext['response']),
        logger: baseSSRContext.logger || ({} as TSSRContext['logger']),
      }
    : ({} as TSSRContext);

  return requestContext;
};

export const requestContextPlugin = (): RuntimePluginFuture => ({
  name: '@modern-js/runtime-plugin-request-context',

  setup(api) {
    api.onBeforeRender(context => {
      const requestContext = makeRequestContext(context);
      context.context = requestContext;
    });
  },
});
