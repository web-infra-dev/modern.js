import {
  defineRuntimeConfig,
  type RuntimePlugin,
} from '@modern-js/runtime';
import type { RouteObject } from '@modern-js/runtime/router';
import { Link, Outlet, useMatch } from '@modern-js/runtime/tanstack-router';

const probeRouterHooksPlugin = (): RuntimePlugin => ({
  name: 'probe-tanstack-router-hooks',
  setup: api => {
    (api as any).onBeforeCreateRoutes((context: any) => {
      (globalThis as any).__tanstackBeforeCreateRoutes = true;
      context?.ssrContext?.response?.setHeader?.(
        'x-tanstack-before-create-routes',
        '1',
      );
    });

    (api as any).modifyRoutes((routes: RouteObject[]) => {
      const rewrite = (items: RouteObject[]): RouteObject[] =>
        items.map(route => {
          const next: RouteObject = { ...route };
          if (next.path === 'original') {
            next.path = 'modified';
          }
          if (Array.isArray(next.children) && next.children.length) {
            next.children = rewrite(next.children);
          }
          return next;
        });

      return rewrite(routes);
    });
  },
});

function RootLayout() {
  const rootMatch = useMatch({ strict: false, from: '__root__' as any });
  const rootLoaderData = (rootMatch as any)?.loaderData || {};
  return (
    <div id="root">
      <div id="root-loader">{rootLoaderData.root || 'missing-root'}</div>
      <Link to="/modified" data-testid="link-modified">
        modified
      </Link>
      <Outlet />
    </div>
  );
}

function ModifiedPage() {
  const match = useMatch({ strict: false, from: '/modified' as any });
  const loaderData = (match as any)?.loaderData || {};
  return <div id="page">modified:{loaderData.hook ? 'hooked' : 'missing'}</div>;
}

export default defineRuntimeConfig({
  plugins: [probeRouterHooksPlugin()],
  router: {
    framework: 'tanstack',
    createRoutes: () => [
      {
        id: 'root',
        path: '/',
        loader: () => ({ root: 'ok' }),
        Component: RootLayout,
        children: [
          {
            id: 'original',
            path: 'original',
            loader: () => ({
              hook: Boolean((globalThis as any).__tanstackBeforeCreateRoutes),
            }),
            Component: ModifiedPage,
          },
        ],
      },
    ],
  },
});
