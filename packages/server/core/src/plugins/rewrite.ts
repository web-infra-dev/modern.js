import type { ServerPluginLegacy } from '../types';

declare module 'Hono' {
  interface Context {
    rewriteByEntry: (entry: string) => void;
    rewrite: (entry: string) => void;
  }
}

export const routerRewritePlugin = (): ServerPluginLegacy => ({
  name: '@Modern-js/plugin-router-rewrite-plugin',
  setup(api) {
    return {
      prepare() {
        const { middlewares, routes } = api.useAppContext();
        if (!routes) {
          return;
        }

        middlewares.push({
          name: 'router-rewrite',
          order: 'pre',
          handler: async (c, next) => {
            c.rewriteByEntry = (entry: string) => {
              const rewriteRoute = routes
                .filter(route => !route.isApi)
                .find(route => route.entryName === entry);

              if (rewriteRoute) {
                c.set('matchPathname', rewriteRoute.urlPath);
                c.set('matchEntryName', entry);
              }
            };
            await next();
          },
        });
      },
    };
  },
});
