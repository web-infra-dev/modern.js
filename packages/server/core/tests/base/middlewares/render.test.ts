import path from 'path';
import { fs } from '@modern-js/utils';
import { ServerRoute } from '@modern-js/types';
import {
  bindRenderHandler,
  createServerBase,
  injectReporter,
} from '../../../src/base';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';
import { ServerUserConfig } from '../../../src/types/config';

async function getHtmlsForRoutes(routes: ServerRoute[], pwd: string) {
  const htmls = await Promise.all(
    routes.map(async route => {
      let html: string | undefined;
      try {
        const htmlPath = path.join(pwd, route.entryPath);

        html = await fs.readFile(htmlPath, 'utf-8');
      } catch (e) {
        // ignore error
      }
      return [route.entryName!, html];
    }),
  );
  return htmls;
}

async function createSSRServer(
  pwd: string,
  serverConfig: ServerUserConfig = { ssr: true },
) {
  const config = getDefaultConfig();

  config.server = serverConfig;

  const server = createServerBase({
    config,
    pwd,
    appContext: getDefaultAppContext(),
  });

  server.all('*', injectReporter());

  await server.init();

  const routes: ServerRoute[] = require(path.resolve(pwd, 'route.json'));

  await bindRenderHandler(server, {
    pwd,
    appContext: getDefaultAppContext(),
    config,
    routes,
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    templates: Object.fromEntries(await getHtmlsForRoutes(routes, pwd)),
  });

  return server;
}

describe('should render html correctly', () => {
  const pwd = path.join(__dirname, '../fixtures/render');

  it('should csr correctly', async () => {
    const csrPwd = path.join(pwd, 'csr');
    const config = getDefaultConfig();

    const server = createServerBase({
      config,
      pwd: csrPwd,
      appContext: getDefaultAppContext(),
    });

    server.use(injectReporter());

    await server.init();

    const routes = require(path.resolve(csrPwd, 'route.json'));

    await bindRenderHandler(server, {
      pwd: csrPwd,
      appContext: getDefaultAppContext(),
      config,
      routes,
      // eslint-disable-next-line node/no-unsupported-features/es-builtins
      templates: Object.fromEntries(await getHtmlsForRoutes(routes, csrPwd)),
    });

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
});
