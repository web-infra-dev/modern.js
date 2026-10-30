import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ServerRoute } from '@modern-js/types';
import { injectResourcePlugin } from '../../src/adapters/node/plugins';
import { createDefaultPlugins, renderPlugin } from '../../src/plugins';
import { createServerBase } from '../../src/serverBase';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

const directories: string[] = [];

afterAll(() => {
  for (const directory of directories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('SSG route matching', () => {
  it.each([
    ['/', false],
    ['/app', false],
    ['/', true],
    ['/app', true],
  ])(
    'keeps exact SSG pages and the %s entry fallback (SSR: %s)',
    async (base, isSSR) => {
      const pwd = fs.mkdtempSync(path.join(os.tmpdir(), 'modern-ssg-'));
      directories.push(pwd);
      fs.cpSync(path.join(__dirname, '../fixtures/render/ssr'), pwd, {
        recursive: true,
      });
      fs.writeFileSync(path.join(pwd, 'ssg.html'), 'PRERENDERED PAGE');
      const [fixture] = JSON.parse(
        fs.readFileSync(path.join(pwd, 'route.json'), 'utf8'),
      );
      const prefix = base === '/' ? '' : base;
      const fallback: ServerRoute = { ...fixture, urlPath: base, isSSR };
      const routes = [
        fallback,
        ...[
          base,
          `${prefix}/blog`,
          `${prefix}/blog/hello`,
          `${prefix}/trailing/`,
        ].map(urlPath => ({
          ...fallback,
          urlPath,
          isSSR: false,
          isSSG: true,
          entryPath: 'ssg.html',
        })),
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

      for (const pathname of [
        base,
        `${prefix}/blog`,
        `${prefix}/blog/`,
        `${prefix}/blog/hello?preview=1`,
        `${prefix}/trailing`,
        `${prefix}/trailing/`,
      ]) {
        const response = await server.request(pathname, {}, {});
        expect(response.status).toBe(200);
        expect(await response.text()).toBe('PRERENDERED PAGE');
      }
      for (const pathname of [
        `${prefix}/blog/does-not-exist`,
        `${prefix}/blog/hello/child`,
        `${prefix}/trailing/child`,
        `${prefix}/unknown/path`,
      ]) {
        const response = await server.request(pathname, {}, {});
        expect(response.status).toBe(200);
        expect(await response.text()).toContain(
          isSSR ? 'SSR Render' : 'Hello Modern',
        );
      }
    },
  );
});
