import { defineRuntimeConfig, type RuntimePlugin } from '@modern-js/runtime';
import type routerPlugin from '@modern-js/runtime/router/internal';
import type { RouteObject } from '@modern-js/runtime/router';

function preparePages(routes: RouteObject[]): RouteObject[] {
  return routes.map(route => {
    const load = route.handle?.loadClientComponent;
    return {
      ...route,
      ...(route.children && { children: preparePages(route.children) }),
      ...(load && {
        element: undefined,
        lazy: async () => ({ Component: (await load()).default }),
      }),
    } as RouteObject;
  });
}

const prepareClientPages = (): ReturnType<typeof routerPlugin> => ({
  name: 'lab-prepare-client-pages',
  pre: ['@modern-js/plugin-router'],
  setup(api) {
    api.modifyRoutes(routes => {
      const context = api.getRuntimeContext();
      // Keep streamed SSR and its hydration/commit boundaries unchanged.
      if (!context.isBrowser || context.ssr) return routes;
      return preparePages(routes);
    });
  },
});

export default defineRuntimeConfig({
  plugins: [prepareClientPages() as RuntimePlugin],
});
