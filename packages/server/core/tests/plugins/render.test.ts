import path from 'path';
import type {
  Logger,
  MonitorEvent,
  Monitors,
  ServerRoute,
} from '@modern-js/types';
import type { NodeRequest } from '@modern-js/types/server';
import { TrieRouter } from 'hono/router/trie-router';
import { injectResourcePlugin } from '../../src/adapters/node/plugins';
import { createDefaultPlugins, renderPlugin } from '../../src/plugins';
import { createRender, matchRoute } from '../../src/plugins/render/render';
import { createServerBase } from '../../src/serverBase';
import type {
  ServerManifest,
  ServerPlugin,
  ServerUserConfig,
  UserConfig,
} from '../../src/types';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

const logger: Logger = {
  error() {
    // ignore
  },
  info() {
    // ignore
  },
  warn() {
    // ignore
  },
  debug() {
    // ignore
  },
};

async function createSSRServer(
  pwd: string,
  serverConfig: ServerUserConfig = { ssr: true },
  extraPlugins: ServerPlugin[] = [],
) {
  const config = getDefaultConfig();

  config.server = serverConfig;

  const routes: ServerRoute[] = require(path.resolve(pwd, 'route.json'));

  const server = createServerBase({
    routes,
    config,
    pwd,
    appContext: getDefaultAppContext(),
  });

  server.addPlugins([
    ...createDefaultPlugins({
      logger,
    }),
    ...extraPlugins,
    injectResourcePlugin(),
    renderPlugin(),
  ]);

  await server.init();

  return server;
}

function createMonitorCapturePlugin(events: MonitorEvent[]): ServerPlugin {
  return {
    name: 'monitor-capture',
    setup(api) {
      api.onPrepare(() => {
        const { middlewares } = api.getServerContext();
        middlewares.push({
          name: 'monitor-capture',
          handler: async (c, next) => {
            c.get('monitors')?.push(event => events.push(event));
            return next();
          },
        });
      });
    },
  };
}

function expectFallbackReport(events: MonitorEvent[], reason: string) {
  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'log',
        payload: expect.objectContaining({
          level: 'warn',
          message: 'fallback to CSR reason: %o',
          args: [{ type: reason }],
        }),
      }),
      expect.objectContaining({
        type: 'counter',
        payload: expect.objectContaining({
          name: 'ssr-fallback',
          tags: { type: reason },
        }),
      }),
    ]),
  );
}

describe('should render html correctly', () => {
  const pwd = path.join(__dirname, '../fixtures/render');

  it('should csr correctly', async () => {
    const csrPwd = path.join(pwd, 'csr');
    const config = getDefaultConfig();

    const routes = require(path.resolve(csrPwd, 'route.json'));

    const server = createServerBase({
      routes,
      config,
      pwd: csrPwd,
      appContext: getDefaultAppContext(),
    });

    server.addPlugins([
      ...createDefaultPlugins({
        logger,
      }),
      injectResourcePlugin(),
      renderPlugin(),
    ]);

    await server.init();

    const response = await server.request('/', {}, {});
    const html = await response.text();

    expect(html).toMatch(/Hello Modern/);
  });

  it('should render ssr correctly', async () => {
    const ssrPwd = path.join(pwd, 'ssr');

    const server = await createSSRServer(ssrPwd);

    const response = await server.request('/', {}, {});
    const html = await response.text();

    expect(html).toBe('SSR Render');

    const html2 = await Promise.resolve(server.request('/user', {}, {})).then(
      res => res.text(),
    );

    expect(html2).toBe('SSR User Render');
  });

  it('should return empty params for unmatched route', () => {
    const router = new TrieRouter<ServerRoute>();
    const route = {
      urlPath: '/user',
      entryName: 'user',
    } as ServerRoute;

    router.add('*', '/user/*', route);

    const [routeInfo, params] = matchRoute(router, '/missing');

    expect(routeInfo).toBeUndefined();
    expect(params).toEqual({});
  });

  it('should force csr correctly', async () => {
    const ssrPwd = path.join(pwd, 'ssr');
    const server = await createSSRServer(ssrPwd, {
      ssr: {
        forceCSR: true,
      },
    });

    const html1 = await Promise.resolve(server.request('/', {}, {})).then(res =>
      res.text(),
    );
    expect(html1).toBe('SSR Render');

    let fallbackHeader;
    const html2 = await Promise.resolve(server.request('/?csr=1', {}, {})).then(
      res => {
        fallbackHeader = res.headers.get('x-modern-ssr-fallback');
        return res.text();
      },
    );
    expect(html2).toMatch(/Hello Modern/);
    expect(
      html2.includes(
        `<script id="__modern_ssr_fallback_reason__" type="application/json">{"reason":"query"}</script>`,
      ),
    ).toBe(true);
    expect(fallbackHeader).toBe('1;reason=query');

    const html3 = await Promise.resolve(
      server.request(
        '/',
        {
          headers: new Headers({
            'x-modern-ssr-fallback': '1',
          }),
        },
        {},
      ),
    ).then(res => {
      fallbackHeader = res.headers.get('x-modern-ssr-fallback');
      return res.text();
    });
    expect(fallbackHeader).toBe('1;reason=header');
    expect(
      html3.includes(
        `<script id="__modern_ssr_fallback_reason__" type="application/json">{"reason":"header"}</script>`,
      ),
    ).toBe(true);
    expect(html3).toMatch(/Hello Modern/);

    // custom fallback reason in header.
    const html4 = await Promise.resolve(
      server.request(
        '/',
        {
          headers: new Headers({
            'x-modern-ssr-fallback': '1;reason=custom fallback reason',
          }),
        },
        {},
      ),
    ).then(res => {
      fallbackHeader = res.headers.get('x-modern-ssr-fallback');
      return res.text();
    });
    expect(fallbackHeader).toBe('1;reason=header,custom fallback reason');
    expect(
      html4.includes(
        `<script id="__modern_ssr_fallback_reason__" type="application/json">{"reason":"header,custom fallback reason"}</script>`,
      ),
    ).toBe(true);
    expect(html4).toMatch(/Hello Modern/);
  });

  it('should report monitor events when forcing csr fallback', async () => {
    const ssrPwd = path.join(pwd, 'ssr');
    const monitorEvents: MonitorEvent[] = [];
    const server = await createSSRServer(
      ssrPwd,
      {
        ssr: {
          forceCSR: true,
        },
      },
      [createMonitorCapturePlugin(monitorEvents)],
    );

    let fallbackHeader;
    const html = await Promise.resolve(server.request('/?csr=1', {}, {})).then(
      res => {
        fallbackHeader = res.headers.get('x-modern-ssr-fallback');
        return res.text();
      },
    );

    expect(html).toMatch(/Hello Modern/);
    expect(fallbackHeader).toBe('1;reason=query');
    expect(
      html.includes(
        `<script id="__modern_ssr_fallback_reason__" type="application/json">{"reason":"query"}</script>`,
      ),
    ).toBe(true);
    expectFallbackReport(monitorEvents, 'query');
  });

  it('support serve data', async () => {
    const ssrPwd = path.join(pwd, 'ssr');

    const server = await createSSRServer(ssrPwd);

    const response = await server.request('/?__loader=page', {}, {});
    const text = await response.text();

    expect(text).toBe('handle main');

    const response2 = await server.request('/user?__loader=layout', {}, {});
    const text2 = await response2.text();
    expect(text2).toBe('handle user');
  });

  it('should fallback to csr when render error', async () => {
    const ssrPwd = path.join(pwd, 'ssr');
    const server = await createSSRServer(ssrPwd, {
      ssr: {
        forceCSR: true,
      },
    });
    let fallbackHeader;
    // custom fallback reason in header.
    const html = await Promise.resolve(
      server.request(
        '/',
        {
          headers: new Headers({
            'x-render-error': '1',
          }),
        },
        {},
      ),
    ).then(res => {
      fallbackHeader = res.headers.get('x-modern-ssr-fallback');
      return res.text();
    });
    expect(fallbackHeader).toBe('1;reason=error');
    expect(
      html.includes(
        `<script id="__modern_ssr_fallback_reason__" type="application/json">{"reason":"error"}</script>`,
      ),
    ).toBe(true);
  });

  it('should report monitor events when render error triggers csr fallback', async () => {
    const ssrPwd = path.join(pwd, 'ssr');
    const monitorEvents: MonitorEvent[] = [];
    const server = await createSSRServer(
      ssrPwd,
      {
        ssr: {
          forceCSR: true,
        },
      },
      [createMonitorCapturePlugin(monitorEvents)],
    );

    let fallbackHeader;
    const html = await Promise.resolve(
      server.request(
        '/',
        {
          headers: new Headers({
            'x-render-error': '1',
          }),
        },
        {},
      ),
    ).then(res => {
      fallbackHeader = res.headers.get('x-modern-ssr-fallback');
      return res.text();
    });

    expect(fallbackHeader).toBe('1;reason=error');
    expect(
      html.includes(
        `<script id="__modern_ssr_fallback_reason__" type="application/json">{"reason":"error"}</script>`,
      ),
    ).toBe(true);
    expectFallbackReport(monitorEvents, 'error');
  });
});

describe('createRender', () => {
  const route = {
    urlPath: '/',
    entryName: 'main',
    entryPath: 'index.html',
    isSSR: true,
  } as ServerRoute;
  const html = '<html><head></head><body><div id="root"></div></body></html>';

  const createMonitors = () =>
    ({
      push: rstest.fn(),
      error: rstest.fn(),
      warn: rstest.fn(),
      debug: rstest.fn(),
      info: rstest.fn(),
      trace: rstest.fn(),
      timing: rstest.fn(),
      counter: rstest.fn(),
    }) satisfies Monitors;

  async function createTestRender(
    metaName: string,
    requestHandler: (request: Request) => Response,
  ) {
    const render = await createRender({
      routes: [route],
      pwd: '',
      config: {} as UserConfig,
      metaName,
      forceCSR: true,
    });
    const serverManifest = {
      renderBundles: { main: { requestHandler } },
    } as unknown as ServerManifest;

    return (
      headers: Record<string, string>,
      request = new Request('http://localhost/', { headers }),
    ) => {
      const monitors = createMonitors();
      return render(request, {
        monitors,
        templates: { 'main-/': html },
        serverManifest,
        nodeReq: { headers, url: '/' } as unknown as NodeRequest,
      }).then(async response => ({
        monitors,
        headers: response.headers,
        html: await response.text(),
      }));
    };
  }

  it('reads and sets the fallback header named after metaName', async () => {
    const render = await createTestRender('my-app', () => new Response('SSR'));

    for (const reason of ['first', 'second']) {
      const result = await render({
        'x-my-ssr-fallback': `1;reason=${reason}`,
      });

      expect(result.headers.get('x-my-ssr-fallback')).toBe(
        `1;reason=header,${reason}`,
      );
      expect(result.html).toContain(
        `<script id="__my_ssr_fallback_reason__" type="application/json">{"reason":"header,${reason}"}</script>`,
      );
    }
    expect((await render({})).html).toBe('SSR');
  });

  it('only reads the request headers to report an error', async () => {
    const headers = { 'x-custom': 'custom' };
    const request = new Request('http://localhost/', { headers });
    const forEach = rstest.spyOn(request.headers, 'forEach');
    const render = await createTestRender(
      'modern-js',
      () => new Response('SSR'),
    );

    expect((await render(headers, request)).html).toBe('SSR');
    expect(forEach).not.toHaveBeenCalled();
  });

  it('reports render errors with the request headers except cookie', async () => {
    const error = new Error('render failed');
    const render = await createTestRender('modern-js', () => {
      throw error;
    });

    const result = await render({
      cookie: 'token=secret',
      'x-custom': 'custom',
    });

    expect(result.headers.get('x-modern-ssr-fallback')).toBe('1;reason=error');
    expect(result.monitors.error).toHaveBeenCalledTimes(1);
    expect(result.monitors.error).toHaveBeenCalledWith(
      expect.stringContaining('SSR Error - '),
      error.stack,
      '/',
      { 'x-custom': 'custom' },
    );
  });
});
