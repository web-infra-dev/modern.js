import {
  createRouter,
} from '@tanstack/react-router';
import { createMemoryHistory } from '@tanstack/history';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import { createRouteTreeFromRouteObjects } from '../../src/router/runtime/tanstack/routeTree';

async function loadRouteTree(routeTree: any, pathname: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [pathname],
    }),
    context: {
      request: new Request(`http://localhost${pathname}`),
      requestContext: {},
    },
  });

  await router.load();
  return router;
}

describe('tanstack route tree from RouteObject[]', () => {
  test('maps root loader and dynamic params', async () => {
    const routes: RouteObject[] = [
      {
        id: 'root',
        path: '/',
        loader: () => ({ root: 'ok' }),
        Component: () => null,
        children: [
          {
            id: 'user',
            path: 'user/:id',
            loader: ({ params }: any) => ({ id: params.id }),
            Component: () => null,
          },
        ],
      },
    ];

    const routeTree = createRouteTreeFromRouteObjects(routes);
    const router = await loadRouteTree(routeTree, '/user/123');

    const rootMatch = router.state.matches.find(match => match.routeId === '__root__');
    const userMatch = router.state.matches.find(
      match => match.routeId === '/user/$id',
    );

    expect(rootMatch?.loaderData).toEqual({ root: 'ok' });
    expect(userMatch?.loaderData).toEqual({ id: '123' });
  });

  test('maps splat params', async () => {
    let splatParamValue = '';
    const routes: RouteObject[] = [
      {
        id: 'root',
        path: '/',
        Component: () => null,
        children: [
          {
            id: 'files',
            path: 'files/*',
            loader: ({ params }: any) => {
              splatParamValue = String(params['*'] || '');
              return { value: params['*'] };
            },
            Component: () => null,
          },
        ],
      },
    ];

    const routeTree = createRouteTreeFromRouteObjects(routes);

    const splatRouter = await loadRouteTree(routeTree, '/files/a/b/c');
    const filesMatch = splatRouter.state.matches.find(
      match => match.routeId === '/files/$',
    );
    expect(filesMatch?.loaderData).toEqual({ value: 'a/b/c' });
    expect(splatParamValue).toBe('a/b/c');
  });
});
