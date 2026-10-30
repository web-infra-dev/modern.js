import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import { injectResourcePlugin } from '../../src/adapters/node/plugins';
import { createDefaultPlugins, renderPlugin } from '../../src/plugins';
import { createServerBase } from '../../src/serverBase';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

it.each([false, true, undefined])(
  'matches SSG paths exactly with entry SSR=%s',
  async isSSR => {
    const pwd = path.join(__dirname, '../fixtures/render/ssr');
    const [entry, page]: ServerRoute[] = require(path.join(pwd, 'route.json'));
    const routes = [
      ...(isSSR === undefined ? [] : [{ ...entry, isSSR }]),
      { ...page, urlPath: '/blog', isSSR: false, isSSG: true },
    ];
    const server = createServerBase({
      pwd,
      routes,
      config: getDefaultConfig(),
      appContext: getDefaultAppContext(),
    });
    server.addPlugins([
      ...createDefaultPlugins({ logger: false }),
      injectResourcePlugin(),
      renderPlugin(),
    ]);
    await server.init();

    for (const pathname of ['/blog', '/blog?preview=1']) {
      const response = await server.request(pathname, {}, {});
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('<h3>User</h3>');
    }
    for (const pathname of ['/blog/', '/blog/does-not-exist']) {
      const response = await server.request(pathname, {}, {});
      expect(response.status).toBe(isSSR === undefined ? 404 : 200);
      if (isSSR !== undefined) {
        expect(await response.text()).toContain(
          isSSR ? 'SSR Render' : 'Hello Modern',
        );
      }
    }
  },
);
