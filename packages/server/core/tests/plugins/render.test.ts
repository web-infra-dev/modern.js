import path from 'path';
import { ServerRoute } from '@modern-js/types';
import { createLogger } from '@modern-js/utils';
import { createServerBase } from '../../src/serverBase';
import { monitorPlugin, renderPlugin } from '../../src/plugins';
import { getPathnameFromNodeReq } from '../../src/plugins/render/ssrRender';
import { injectResourcePlugin } from '../../src/adapters/node/plugins';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';
import { ServerUserConfig } from '../../src/types';

async function createSSRServer(
  pwd: string,
  serverConfig: ServerUserConfig = { ssr: true },
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
    monitorPlugin({
      logger: createLogger(),
    }),
    injectResourcePlugin(),
    renderPlugin({}),
  ]);

  await server.init();

  return server;
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
      monitorPlugin({
        logger: createLogger(),
      }),
      injectResourcePlugin(),
      renderPlugin({}),
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

    const html2 = await Promise.resolve(server.request('/?csr=1', {}, {})).then(
      res => res.text(),
    );
    expect(html2).toMatch(/Hello Modern/);

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
    ).then(res => res.text());
    expect(html3).toMatch(/Hello Modern/);
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
});

describe('should get attributes from node req correctly', () => {
  it('should get pathname from node req correctly', () => {
    expect(
      getPathnameFromNodeReq({
        url: '/main/',
      } as any),
    ).toBe('/main');

    expect(
      getPathnameFromNodeReq({
        url: '/',
      } as any),
    ).toBe('/');

    expect(
      getPathnameFromNodeReq({
        url: '/main?name=123',
      } as any),
    ).toBe('/main');

    expect(
      getPathnameFromNodeReq({
        url: '/main/a/b/c/?name=123',
      } as any),
    ).toBe('/main/a/b/c');

    expect(
      getPathnameFromNodeReq({
        url: '/main/1?name=123',
      } as any),
    ).toBe('/main/1');
  });
});
