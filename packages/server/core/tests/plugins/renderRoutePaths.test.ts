import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import { injectResourcePlugin } from '../../src/adapters/node/plugins';
import { createDefaultPlugins, renderPlugin } from '../../src/plugins';
import { createRender } from '../../src/plugins/render/render';
import { createServerBase } from '../../src/serverBase';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

async function createRouteServer(urlPath: string, isSSR = true) {
  const pwd = path.join(__dirname, '../fixtures/render', isSSR ? 'ssr' : 'csr');
  const fixtureRoutes: ServerRoute[] = require(path.join(pwd, 'route.json'));
  // A root route would hide an unmatched render middleware by rendering instead.
  const routes = [{ ...fixtureRoutes[0]!, urlPath }];
  const renderedPaths: string[] = [];
  const config = getDefaultConfig();
  const server = createServerBase({
    routes,
    config: { ...config, server: { ssr: { forceCSR: true } } },
    pwd,
    appContext: getDefaultAppContext(),
  });

  server.addPlugins([
    ...createDefaultPlugins({ logger: false }),
    {
      name: 'capture-render-route',
      setup(api) {
        api.onPrepare(() => {
          api.getServerContext().renderMiddlewares.push({
            name: 'capture-render-path',
            handler: async (c, next) => {
              renderedPaths.push(c.req.path);
              c.header('x-render-route', c.req.routePath);
              const id = c.req.param('id');
              if (id) {
                c.header('x-render-id', id);
              }
              await next();
            },
          });
        });
      },
    },
    injectResourcePlugin(),
    renderPlugin(),
  ]);

  await server.init();
  return { server, renderedPaths };
}

describe('render route paths', () => {
  it.each([
    '/detail.html',
    '/page(1).html',
    '/test(bug.txt',
    '/page[1].html',
    '/page+name.html',
    '/page$name.html',
    '/page^name.html',
  ])('renders the literal path %s and its subpaths', async urlPath => {
    const { server, renderedPaths } = await createRouteServer(urlPath);
    for (const pathname of [urlPath, `${urlPath}/child`]) {
      const response = await server.request(pathname, {}, {});

      expect(response.status).toBe(200);
      expect(response.headers.get('x-modernjs-render')).toBe('server');
      expect(response.headers.get('x-render-route')).toBe(`${urlPath}/*`);
      expect(await response.text()).toBe('SSR Render');
    }
    expect(renderedPaths).toEqual([urlPath, `${urlPath}/child`]);
  });

  it.each([
    ['/page^name.html', '/page%5Ename.html'],
    ['/page^name.html', '/page%5ename.html'],
    ['/page name.html', '/page%20name.html'],
    ['/page%25name.html', '/page%25name.html'],
    ['/page%255Ename.html', '/page%255Ename.html'],
    ['/page^%ZZ.html', '/page%5E%ZZ.html'],
  ])('renders %s from the encoded request %s', async (urlPath, requestPath) => {
    const { server, renderedPaths } = await createRouteServer(urlPath);

    for (const suffix of ['', '/child']) {
      const response = await server.request(`${requestPath}${suffix}`, {}, {});

      expect(response.status).toBe(200);
      expect(response.headers.get('x-render-route')).toBe(`${urlPath}/*`);
      expect(await response.text()).toBe('SSR Render');
    }
    expect(renderedPaths).toEqual([urlPath, `${urlPath}/child`]);
  });

  it('does not turn encoded separators into route boundaries', async () => {
    const { server, renderedPaths } =
      await createRouteServer('/page/name.html');

    const response = await server.request('/page%2Fname.html', {}, {});

    expect(response.status).toBe(404);
    expect(renderedPaths).toEqual([]);

    const encodedRoute = await createRouteServer('/page%2Fname.html');
    const encodedResponse = await encodedRoute.server.request(
      '/page%2Fname.html',
      {},
      {},
    );

    expect(encodedResponse.status).toBe(200);
    expect(await encodedResponse.text()).toBe('SSR Render');
    expect(encodedRoute.renderedPaths).toEqual(['/page%2Fname.html']);
  });

  it('keeps an explicit matchPathname literal when rendering directly', async () => {
    const routes = ['/page^name.html', '/page%5Ename.html', '/中文.html'].map(
      urlPath => ({
        urlPath,
        entryName: urlPath,
        isSSR: false,
      }),
    ) as ServerRoute[];
    const render = await createRender({
      routes,
      pwd: '',
      config: getDefaultConfig(),
    });
    const templates = Object.fromEntries(
      routes.map(route => [
        `${route.entryName}-${route.urlPath}`,
        route.urlPath,
      ]),
    );
    const monitors = {
      push: rstest.fn(),
      error: rstest.fn(),
      warn: rstest.fn(),
      debug: rstest.fn(),
      info: rstest.fn(),
      trace: rstest.fn(),
      timing: rstest.fn(),
      counter: rstest.fn(),
    };

    for (const matchPathname of [
      undefined,
      ...routes.map(route => route.urlPath),
    ]) {
      const response = await render(
        new Request('http://localhost/page%5Ename.html'),
        {
          templates,
          matchPathname,
          monitors,
          serverManifest: {},
        },
      );

      expect(response.status).toBe(200);
      expect(await response.text()).toBe(matchPathname ?? '/page^name.html');
    }

    const response = await render(
      new Request('http://localhost/%E4%B8%AD%E6%96%87.html'),
      {
        templates,
        monitors,
        serverManifest: {},
      },
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('/中文.html');
  });

  it('does not interpret a literal dot as a regex wildcard', async () => {
    const { server, renderedPaths } = await createRouteServer('/detail.html');

    for (const pathname of ['/detailXhtml', '/detail.htmlx']) {
      const response = await server.request(pathname, {}, {});
      expect(response.status).toBe(404);
      expect(response.headers.get('x-render-route')).toBeNull();
    }
    expect(renderedPaths).toEqual([]);
  });

  it.each([
    ['/detail.html', '/detail.html'],
    ['/page^name.html', '/page%5Ename.html'],
  ])('renders a CSR page at %s', async (urlPath, requestPath) => {
    const { server, renderedPaths } = await createRouteServer(urlPath, false);
    const response = await server.request(requestPath, {}, {});

    expect(response.status).toBe(200);
    expect(response.headers.get('x-modernjs-render')).toBe('client');
    expect(response.headers.get('x-render-route')).toBe(`${urlPath}/*`);
    expect(await response.text()).toContain('Hello Modern');
    expect(renderedPaths).toEqual([urlPath]);
  });

  it('runs render middleware and CSR fallback at a literal HTML path', async () => {
    const { server, renderedPaths } = await createRouteServer('/detail.html');
    const response = await server.request('/detail.html?csr=1', {}, {});

    expect(response.status).toBe(200);
    expect(response.headers.get('x-modernjs-render')).toBe('client');
    expect(response.headers.get('x-modern-ssr-fallback')).toBe(
      '1;reason=query',
    );
    expect(response.headers.get('x-render-route')).toBe('/detail.html/*');
    expect(await response.text()).toContain('Hello Modern');
    expect(renderedPaths).toEqual(['/detail.html']);
  });

  it('preserves dynamic route parameters and subpaths', async () => {
    const { server, renderedPaths } = await createRouteServer('/users/:id');

    for (const pathname of ['/users/123', '/users/123/child']) {
      const response = await server.request(pathname, {}, {});
      expect(response.status).toBe(200);
      expect(response.headers.get('x-render-id')).toBe('123');
      expect(response.headers.get('x-render-route')).toBe('/users/:id/*');
      expect(await response.text()).toBe('SSR Render');
    }
    expect(renderedPaths).toEqual(['/users/123', '/users/123/child']);
  });

  it.each([
    ['a%5Eb', 'a^b'],
    ['a%2Fb', 'a/b'],
    ['a%25b', 'a%b'],
    ['a%ZZb', 'a%ZZb'],
  ])('preserves the encoded dynamic parameter %s', async (id, expectedId) => {
    const { server } = await createRouteServer('/users/:id/profile');
    const response = await server.request(`/users/${id}/profile`, {}, {});

    expect(response.status).toBe(200);
    expect(response.headers.get('x-render-id')).toBe(expectedId);
    expect(await response.text()).toBe('SSR Render');
  });

  it('preserves the wildcard for routes ending in a slash', async () => {
    const { server, renderedPaths } = await createRouteServer('/detail.html/');

    for (const pathname of ['/detail.html/', '/detail.html/child']) {
      const response = await server.request(pathname, {}, {});
      expect(response.status).toBe(200);
      expect(response.headers.get('x-render-route')).toBe('/detail.html/*');
      expect(await response.text()).toBe('SSR Render');
    }
    expect(renderedPaths).toEqual(['/detail.html/', '/detail.html/child']);
  });
});
