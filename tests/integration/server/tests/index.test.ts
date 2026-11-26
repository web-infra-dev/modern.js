import type { ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const appDir = path.resolve(__dirname, '..');

const HASHED_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const ETAG_REGEX = /^W\/"([0-9a-f]+)-[\w-]{22}"$/;

// The ETag is weak and starts with the size of the body in hex.
const expectETag = (etag: string | null, body: Buffer) => {
  expect(etag).toMatch(ETAG_REGEX);
  expect(Number.parseInt(ETAG_REGEX.exec(etag!)![1], 16)).toBe(body.byteLength);
};

const getStaticFiles = () => {
  const js = fs
    .readdirSync(path.join(appDir, 'dist/static/js'))
    .find(file => /\.[0-9a-f]{8,}\.js$/.test(file));
  expect(js).toBeDefined();
  return [
    // A content hash in the name, in a build asset directory.
    {
      url: `/static/js/${js}`,
      file: `static/js/${js}`,
      cacheControl: HASHED_CACHE_CONTROL,
    },
    // In a build asset directory, but without a content hash.
    {
      url: '/static/image/icon.png',
      file: 'static/image/icon.png',
      cacheControl: 'no-cache',
    },
    { url: '/favicon.ico', file: 'favicon.ico', cacheControl: 'no-cache' },
    {
      url: '/MP_verify_abcdef.txt',
      file: 'public/MP_verify_abcdef.txt',
      cacheControl: 'no-cache',
    },
    // Hash-like names of user files.
    {
      url: '/notes.0123456789ab.txt',
      file: 'public/notes.0123456789ab.txt',
      cacheControl: 'no-cache',
    },
    {
      url: '/static/locales/fr.0123456789ab.json',
      file: 'static/locales/fr.0123456789ab.json',
      cacheControl: 'no-cache',
    },
  ];
};

describe.each(['dev', 'prod'])('server in %s', mode => {
  let app: ChildProcess | undefined;
  let baseUrl: string;

  beforeAll(async () => {
    const port = await getPort();
    baseUrl = `http://127.0.0.1:${port}`;
    if (mode === 'dev') {
      app = await launchApp(appDir, port);
    } else {
      const build = await modernBuild(appDir);
      expect(build.code, build.stderr || build.stdout).toBe(0);
      app = await modernServe(appDir, port);
    }
    expect(app?.pid).toBeDefined();
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  test('runs request and render middleware from server config and plugins', async () => {
    const res = await fetch(baseUrl);
    expect(res.status).toBe(200);
    expect(res.headers.get('server-timing')).toContain('render');
    expect(res.headers.get('x-middleware')).toContain('request');
    expect(res.headers.get('x-message')).toContain('alias test');
    expect(res.headers.get('x-plugin-render-middleware')).toContain('plugin');
    expect(await res.text()).toContain('<body> <h3>bytedance</h3>');
  });

  test('redirects and handles OPTIONS requests', async () => {
    const redirect = await fetch(`${baseUrl}/?auth=1`, { redirect: 'manual' });
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get('location')).toBe('/login');

    const options = await fetch(`${baseUrl}/api/options`, {
      method: 'OPTIONS',
    });
    expect(options.status).toBe(204);
    if (mode === 'prod') {
      expect(options.headers.get('x-options-handler')).toBe('ok');
    }
  });

  if (mode === 'dev') {
    test('exposes monitors during SSR and client navigation and emits JSON router data', async () => {
      const browser = await puppeteer.launch({
        ...launchOptions,
        headless: true,
      });
      try {
        const page = await browser.newPage();
        const response = await page.goto(`${baseUrl}/monitors`, {
          waitUntil: 'networkidle0',
        });
        // Check the server-rendered context before the browser branch can mask it.
        const initialContext = await page.evaluate(
          html => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            return doc.querySelector('#runtimeSign')?.textContent;
          },
          await response!.text(),
        );
        expect(initialContext).toBe('monitors exist in RuntimeContext: 1');
        expect(
          await page.$eval('#__MODERN_ROUTER_DATA__', el =>
            el.getAttribute('type'),
          ),
        ).toBe('application/json');
        expect(await page.$eval('#runtimeSign', el => el.textContent)).toBe(
          'monitors exist in RuntimeContext: 1',
        );
        expect(await page.$eval('#indexSign', el => el.textContent)).toBe(
          'monitors exist in page index: 1',
        );
        await page.click('#toUser');
        await page.waitForSelector('#userSign');
        expect(
          await page.$eval('#userSign', el => el.textContent?.trim()),
        ).toBe('monitors exist in page user: 1');
      } finally {
        await browser.close();
      }
    });

    // Build assets are served by the Rsbuild dev server in development.
    test('revalidates config/public files on every use', async () => {
      for (const url of ['/MP_verify_abcdef.txt', '/notes.0123456789ab.txt']) {
        const res = await fetch(baseUrl + url);
        const body = Buffer.from(await res.arrayBuffer());
        expect({
          url,
          status: res.status,
          cacheControl: res.headers.get('cache-control'),
        }).toEqual({ url, status: 200, cacheControl: 'no-cache' });
        expectETag(res.headers.get('etag'), body);

        const notModified = await fetch(baseUrl + url, {
          headers: { 'If-None-Match': res.headers.get('etag')! },
        });
        expect({ url, status: notModified.status }).toEqual({
          url,
          status: 304,
        });
      }
    });
  } else {
    test('links favicon and touch icons from both entry documents', () => {
      for (const file of [
        'favicon.ico',
        'favicon1.ico',
        'static/image/icon.png',
      ]) {
        expect(fs.existsSync(path.join(appDir, 'dist', file))).toBe(true);
      }
      for (const entry of ['index', 'activity']) {
        const html = fs.readFileSync(
          path.join(appDir, 'dist/html', entry, 'index.html'),
          'utf8',
        );
        expect(html).toContain('<link rel="icon" href="/favicon.ico">');
        expect(html).toContain(
          '<link rel="apple-touch-icon" sizes="180x180" href="/static/image/icon.png">',
        );
      }
    });

    test('serves both entries, copied icons and public files', async () => {
      for (const route of ['/activity', '/favicon1.ico']) {
        expect((await fetch(baseUrl + route)).status).toBe(200);
      }
      for (const [route, mime] of [
        ['/favicon.ico', 'image/x-icon'],
        ['/static/image/icon.png', 'image/png'],
      ]) {
        const res = await fetch(baseUrl + route);
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toBe(mime);
      }
      const verification = await fetch(`${baseUrl}/MP_verify_abcdef.txt`);
      expect(verification.status).toBe(200);
      expect((await verification.text()).trim()).toBe('MP_verify_abcdef.txt');
      const file = await fetch(`${baseUrl}/test(bug.txt`);
      expect(file.status).toBe(200);
      expect((await file.text()).trim()).toBe('test');
    });

    test('sets Cache-Control and ETag on static files only', async () => {
      for (const { url, file, cacheControl } of getStaticFiles()) {
        const res = await fetch(baseUrl + url);
        const body = Buffer.from(await res.arrayBuffer());
        expect({
          url,
          status: res.status,
          cacheControl: res.headers.get('cache-control'),
        }).toEqual({ url, status: 200, cacheControl });
        expect(body).toEqual(fs.readFileSync(path.join(appDir, 'dist', file)));
        expectETag(res.headers.get('etag'), body);
      }
      for (const route of ['/', '/activity']) {
        const page = await fetch(baseUrl + route);
        expect(await page.text()).toContain('<html');
        expect({
          route,
          cacheControl: page.headers.get('cache-control'),
          etag: page.headers.get('etag'),
        }).toEqual({ route, cacheControl: null, etag: null });
      }
    });

    test('answers conditional requests to static files', async () => {
      for (const { url } of getStaticFiles()) {
        const first = await fetch(baseUrl + url);
        await first.arrayBuffer();
        const etag = first.headers.get('etag')!;
        const cacheControl = first.headers.get('cache-control');
        for (const method of ['GET', 'HEAD']) {
          for (const ifNoneMatch of [
            etag,
            // Compared with the weak comparison.
            etag.replace(/^W\//, ''),
            `"other", ${etag}`,
            '*',
          ]) {
            const res = await fetch(baseUrl + url, {
              method,
              headers: { 'If-None-Match': ifNoneMatch },
            });
            expect({ url, method, ifNoneMatch, status: res.status }).toEqual({
              url,
              method,
              ifNoneMatch,
              status: 304,
            });
            expect(await res.text()).toBe('');
            expect(res.headers.get('etag')).toBe(etag);
            expect(res.headers.get('cache-control')).toBe(cacheControl);
          }
        }

        const changed = await fetch(baseUrl + url, {
          headers: { 'If-None-Match': 'W/"0-other"' },
        });
        expect({ url, status: changed.status }).toEqual({ url, status: 200 });
        expect((await changed.arrayBuffer()).byteLength).toBeGreaterThan(0);

        const head = await fetch(baseUrl + url, { method: 'HEAD' });
        expect({ url, status: head.status }).toEqual({ url, status: 200 });
        expect(await head.text()).toBe('');
        expect(head.headers.get('etag')).toBe(etag);
        expect(head.headers.get('cache-control')).toBe(cacheControl);
      }
    });

    test('keeps Cache-Control set by a middleware on a static file', async () => {
      const res = await fetch(`${baseUrl}/no-store.txt`);
      expect(res.status).toBe(200);
      expect((await res.text()).trim()).toBe('no-store');
      expect(res.headers.get('cache-control')).toBe('private, no-store');
      expect(res.headers.get('etag')).toMatch(ETAG_REGEX);
    });

    test('maps all custom routes to the configured entry', async () => {
      for (const route of ['/a', '/b', '/main/example']) {
        const res = await fetch(baseUrl + route);
        expect(res.status).toBe(200);
        expect(await res.text()).toContain('<div>Hello Modern.js</div>');
      }
    });

    test('escapes route parameters in embedded server data', async () => {
      const response = await fetch(
        `${baseUrl}/main/dlwlrma<%2fscript%20x><script%20x>alert(1)%2f%2f`,
      );

      expect(response.status).toBe(200);
      const body = await response.text();

      expect(body).toContain('dlwlrma');
      expect(body).not.toMatch(`dlwlrma</script`);
    });
  }
});
