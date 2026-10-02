import type { RouteObject } from '@modern-js/runtime-utils/router';
import { createMemoryHistory } from '@tanstack/history';
import { createRouter, isNotFound, isRedirect } from '@tanstack/react-router';
import {
  createRouteTreeFromModernRoutes,
  createRouteTreeFromRouteObjects,
  getModernRouteIdsFromMatches,
} from '../../src/runtime/routeTree';

async function loadRouteTree(
  routeTree: any,
  pathname: string,
  basepath?: string,
) {
  const router = createRouter({
    routeTree,
    basepath,
    isServer: true,
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

    const rootMatch = router.state.matches.find(
      match => match.routeId === '__root__',
    );
    const userMatch = router.state.matches.find(
      match => match.routeId === '/user/$id',
    );

    expect(rootMatch?.loaderData).toEqual({ root: 'ok' });
    expect(userMatch?.loaderData).toEqual({ id: '123' });
    expect(getModernRouteIdsFromMatches(router)).toEqual(['root', 'user']);
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

describe.each([
  {
    name: 'RouteObject[]',
    createRouteTree: (loader: () => unknown) =>
      createRouteTreeFromRouteObjects([
        {
          id: 'root',
          path: '/',
          children: [{ id: 'source', path: 'source', loader }],
        },
      ]),
  },
  {
    name: 'Modern routes',
    createRouteTree: (loader: () => unknown) =>
      createRouteTreeFromModernRoutes([
        {
          type: 'nested',
          id: 'root',
          isRoot: true,
          children: [{ type: 'nested', id: 'source', path: 'source', loader }],
        },
      ] as any),
  },
])('$name loader responses', ({ createRouteTree }) => {
  test('reads Modern route IDs from actual matches', async () => {
    const router = await loadRouteTree(
      createRouteTree(() => null),
      '/source',
    );

    expect(getModernRouteIdsFromMatches(router)).toEqual(['root', 'source']);
  });

  test.each(
    [301, 302, 303, 307, 308].flatMap(status => [
      { delivery: 'returned', target: '/target', status },
      { delivery: 'returned', target: 'https://example.com/target', status },
      { delivery: 'thrown', target: '/target', status },
      { delivery: 'thrown', target: 'https://example.com/target', status },
    ]),
  )(
    'converts a $delivery $status redirect to $target',
    async ({ delivery, target, status }) => {
      const routeTree = createRouteTree(async () => {
        const response = new Response(null, {
          status,
          headers: {
            Location: target,
            'Set-Cookie': 'session=modern; Path=/; HttpOnly',
            'X-Modern-Redirect': 'loader',
          },
        });
        if (delivery === 'thrown') {
          await Promise.resolve();
          throw response;
        }
        return response;
      });
      const router = await loadRouteTree(routeTree, '/app/source', '/app');
      const result = router.state.redirect;

      expect(isRedirect(result)).toBe(true);
      expect(result?.status).toBe(status);
      expect(router.state.statusCode).toBe(status);
      expect(result?.headers.get('Set-Cookie')).toBe(
        'session=modern; Path=/; HttpOnly',
      );
      expect(result?.headers.get('X-Modern-Redirect')).toBe('loader');
      if (target.startsWith('https://')) {
        expect(result?.options.href).toBe(target);
        expect(result?.headers.get('Location')).toBe(target);
        expect(result?.options.to).toBeUndefined();
        expect(result?.options.reloadDocument).toBe(true);
      } else {
        expect(result?.options.to).toBe(target);
        expect(result?.options.href).toBe(`/app${target}`);
        expect(result?.headers.get('Location')).toBe(`/app${target}`);
        expect(result?.options.reloadDocument).not.toBe(true);
      }
    },
  );

  test('converts an asynchronously thrown 404 to a not-found match', async () => {
    const routeTree = createRouteTree(async () => {
      await Promise.resolve();
      throw new Response(null, { status: 404 });
    });
    const router = await loadRouteTree(routeTree, '/source');

    expect(router.state.statusCode).toBe(404);
    expect(router.state.matches[0]?.globalNotFound).toBe(true);
    expect(router.state.matches.some(match => isNotFound(match.error))).toBe(
      true,
    );
  });
});
