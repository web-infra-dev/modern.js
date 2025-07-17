import type { MiddlewareObj, ServerPlugin } from '../types';

export const injectConfigMiddlewarePlugin = (
  configMiddlewares: MiddlewareObj[] = [],
  configRenderMiddlewares: MiddlewareObj[] = [],
): ServerPlugin => ({
  name: '@modern-js/plugin-inject-config-middleware',

  setup(api) {
    api.onPrepare(() => {
      const { middlewares, renderMiddlewares } = api.getServerContext();

      configMiddlewares.forEach(m => {
        middlewares.push(m);
      });

      configRenderMiddlewares.forEach(m => {
        renderMiddlewares.push(m);
      });
    });
  },
});
