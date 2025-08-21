import type { Context, Next } from 'hono';
import type { ServerPlugin } from '../types';

declare module 'hono' {
  interface Context {
    rewriteByEntry: (entry: string) => void;
  }
}

export const routerRewritePlugin = (): ServerPlugin => ({
  name: '@Modern-js/plugin-router-rewrite-plugin',
  setup(api) {
    api.onPrepare(() => {
      const { middlewares, routes } = api.getServerContext();
      if (!routes) {
        return;
      }

      middlewares.push({
        name: 'router-rewrite',
        order: 'pre',
        handler: async (c: Context, next: Next) => {
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
    });
  },
});
