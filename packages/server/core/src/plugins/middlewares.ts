import type { MiddlewareObj, ServerPlugin } from '../types';

export const injectConfigMiddlewarePlugin = (
  configMiddlewares: MiddlewareObj[] = [],
  configRenderMiddlewares: MiddlewareObj[] = [],
): ServerPlugin => ({
  name: '@modern-js/plugin-inject-config-middleware',

  setup(api) {
    return {
      prepare() {
        const { middlewares, renderMiddlewares } = api.useAppContext();

        configMiddlewares.forEach(m => {
          middlewares.push(m);
        });

        configRenderMiddlewares.forEach(m => {
          renderMiddlewares.push(m);
        });
      },
    };
  },
});
