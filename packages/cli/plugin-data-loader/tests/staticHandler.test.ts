import { storage } from '@modern-js/runtime-utils/node';
import { createStaticHandler, redirect } from '@modern-js/runtime-utils/router';
import type { NestedRoute, ServerRoute } from '@modern-js/types';
import { LOADER_ID_PARAM } from '../src/common/constants';
import { handleRequest } from '../src/runtime';

rstest.mock('@modern-js/runtime-utils/router', () => {
  const actual = rstest.requireActual<
    typeof import('@modern-js/runtime-utils/router')
  >('@modern-js/runtime-utils/router');
  return {
    ...actual,
    createStaticHandler: rstest.fn(actual.createStaticHandler),
  };
});

const serverRoutes: ServerRoute[] = [
  { urlPath: '/', entryName: 'main', entryPath: 'html/main/index.html' },
  { urlPath: '/three', entryName: 'three', entryPath: 'html/three/index.html' },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createRoutes = () =>
  [
    {
      path: '/',
      id: 'layout',
      type: 'nested',
      children: [
        {
          path: 'user/:id',
          id: 'user/[id]/page',
          type: 'nested',
          loader: async ({ request, params, context }: any) => {
            // interleave concurrent requests
            await delay(Number(params.id) % 5);
            return Response.json({
              id: params.id,
              header: request.headers.get('x-request-id'),
              storageHeader: storage.useContext().headers?.['x-request-id'],
              context: context.get('user'),
            });
          },
        },
        {
          path: 'deferred/:id',
          id: 'deferred/[id]/page',
          type: 'nested',
          // plain objects are tracked in the activeDeferreds of the request storage
          loader: async ({ params }: any) => {
            await delay(Number(params.id) % 5);
            return { id: params.id };
          },
        },
        {
          path: 'redirect',
          id: 'redirect/page',
          type: 'nested',
          loader: () => redirect('/user/1'),
        },
        {
          path: 'error',
          id: 'error/page',
          type: 'nested',
          loader: () => {
            throw new Error('loader error');
          },
        },
      ],
    },
  ] as NestedRoute[];

const request = (
  routes: NestedRoute[],
  pathname: string,
  routeId: string,
  id = '',
) =>
  handleRequest({
    request: new Request(
      `http://localhost${pathname}?${LOADER_ID_PARAM}=${routeId}`,
      { headers: { 'x-request-id': id } },
    ),
    serverRoutes,
    routes,
    context: {
      monitors: undefined as any,
      loaderContext: new Map([['user', `user-${id}`]]),
    },
  }) as Promise<Response>;

describe('static handler cache', () => {
  beforeEach(() => {
    rstest.mocked(createStaticHandler).mockClear();
  });

  afterEach(() => {
    rstest.unstubAllEnvs();
  });

  it('should return per-request data for sequential and concurrent requests', async () => {
    const routes = createRoutes();
    const ids = Array.from({ length: 20 }, (_, i) => String(i + 1));
    const check = async (id: string) => {
      const res = await request(
        routes,
        `/three/user/${id}`,
        'user/[id]/page',
        id,
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        id,
        header: id,
        storageHeader: id,
        context: `user-${id}`,
      });
    };

    for (const id of ids.slice(0, 3)) {
      await check(id);
    }
    await Promise.all(ids.map(check));
  });

  it('should keep deferred data per request', async () => {
    const routes = createRoutes();
    const ids = Array.from({ length: 10 }, (_, i) => String(i + 1));
    await Promise.all(
      ids.map(async id => {
        const res = await request(
          routes,
          `/three/deferred/${id}`,
          'deferred/[id]/page',
        );
        expect(res.headers.get('content-type')).toMatch(
          'text/modernjs-deferred',
        );
        expect(await res.text()).toBe(`${JSON.stringify({ id })}\n\n`);
      }),
    );
  });

  it('should still handle redirects and errors', async () => {
    const routes = createRoutes();
    const redirectRes = await request(
      routes,
      '/three/redirect',
      'redirect/page',
    );
    expect(redirectRes.status).toBe(204);
    expect(redirectRes.headers.get('X-Modernjs-Redirect')).toBe('/user/1');

    const errorRes = await request(routes, '/three/error', 'error/page');
    expect(errorRes.status).toBe(500);
    expect((await errorRes.json()).message).toBe('loader error');

    const forbidden = await request(routes, '/three/error', 'redirect/page');
    expect(forbidden.status).toBe(403);
  });

  it('should create the static handler once per routes and basename', async () => {
    const routes = createRoutes();
    await request(routes, '/three/user/1', 'user/[id]/page', '1');
    await request(routes, '/three/user/2', 'user/[id]/page', '2');
    await request(routes, '/three/error', 'error/page');
    expect(createStaticHandler).toHaveBeenCalledTimes(1);
    expect(rstest.mocked(createStaticHandler).mock.calls[0][1]).toEqual({
      basename: '/three',
    });

    const res = await request(routes, '/user/3', 'user/[id]/page', '3');
    expect((await res.json()).id).toBe('3');
    await request(routes, '/user/4', 'user/[id]/page', '4');
    expect(createStaticHandler).toHaveBeenCalledTimes(2);
    expect(rstest.mocked(createStaticHandler).mock.calls[1][1]).toEqual({
      basename: '/',
    });

    await request(createRoutes(), '/three/user/5', 'user/[id]/page', '5');
    expect(createStaticHandler).toHaveBeenCalledTimes(3);
  });

  it('should not cache the static handler in development', async () => {
    rstest.stubEnv('NODE_ENV', 'development');
    const routes = createRoutes();
    await request(routes, '/three/user/1', 'user/[id]/page', '1');
    const res = await request(routes, '/three/user/2', 'user/[id]/page', '2');
    expect((await res.json()).id).toBe('2');
    expect(createStaticHandler).toHaveBeenCalledTimes(2);
  });
});
