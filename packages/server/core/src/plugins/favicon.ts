import type { ServerPluginLegacy } from '../types';

export const faviconPlugin = (): ServerPluginLegacy => ({
  name: '@modern-js/plugin-favicon',

  setup(api) {
    return {
      prepare() {
        const { middlewares } = api.useAppContext();

        middlewares.push({
          name: 'favicon-fallback',
          path: '/favicon.ico',
          handler: async (c, _next) => {
            return c.body(null, 204);
          },
        });
      },
    };
  },
});
