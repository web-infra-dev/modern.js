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

describe.each(['dev', 'prod'])('server in %s', mode => {
  let app: ChildProcess | undefined;
  let baseUrl: string;
  let buildOutput = '';

  beforeAll(async () => {
    const port = await getPort();
    baseUrl = `http://127.0.0.1:${port}`;
    if (mode === 'dev') {
      app = await launchApp(appDir, port);
    } else {
      const build = await modernBuild(appDir);
      expect(build.code, build.stderr || build.stdout).toBe(0);
      buildOutput = `${build.stdout}${build.stderr}`;
      app = await modernServe(appDir, port);
    }
    expect(app?.pid).toBeDefined();
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  // This app has no tsconfig.server.json and its tsconfig.json extends the
  // bundler-mode base (module: ESNext), so the server compile falls back to
  // tsconfig.json with NodeNext overrides to keep CommonJS output.
  test('compiles the custom server to CommonJS through the tsconfig.json fallback', () => {
    if (mode !== 'prod') {
      return;
    }
    const fallbackWarning = 'add a tsconfig.server.json';
    expect(buildOutput.split(fallbackWarning).length - 1).toBe(1);
    const serverEntry = fs.readFileSync(
      path.join(appDir, 'dist/server/modern.server.js'),
      'utf-8',
    );
    expect(serverEntry).toContain('exports.');
    expect(serverEntry).not.toMatch(/^import /m);
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
