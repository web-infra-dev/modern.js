import path from 'path';
import { isVersionAtLeast18 } from '@modern-js/utils';
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

interface TestConfig {
  mode: 'dev' | 'build';
}

interface TestOptions {
  baseUrl: string;
  appPort: number;
  page: Page;
}

function skipForLowerNodeVersion() {
  if (!isVersionAtLeast18()) {
    test('should skip in lower node version', () => {
      expect(true).toBe(true);
    });
    return true;
  }
  return false;
}

function runTests({ mode }: TestConfig) {
  describe(`${mode}`, () => {
    let app: any;
    let appPort: number;
    let page: Page;
    let browser: Browser;
    const errors: string[] = [];

    if (skipForLowerNodeVersion()) {
      return;
    }

    beforeAll(async () => {
      appPort = await getPort();

      if (mode === 'dev') {
        app = await launchApp(appDir, appPort);
      } else {
        await modernBuild(appDir);
        app = await modernServe(appDir, appPort, {
          cwd: appDir,
        });
      }

      browser = await puppeteer.launch(launchOptions as any);
      page = await browser.newPage();

      if (mode === 'build') {
        page.on('pageerror', error => {
          errors.push((error as Error).message);
        });
      }
    });

    afterAll(async () => {
      await killApp(app);
      await page.close();
      await browser.close();
    });

    describe('client component root', () => {
      const baseUrl = `/client-component-root`;

      it('should render page correctly', () =>
        renderClientRootPageCorrectly({ baseUrl, appPort, page }));
      it('should render page with context correctly', () =>
        renderPageWithContext({ baseUrl, appPort, page }));
      it('should support response api', () =>
        supportResponseAPIForClientRoot({ baseUrl, appPort, page }));
    });

    describe('server component root', () => {
      const baseUrl = `/server-component-root`;
      it('should render page correctly', () =>
        renderServerRootPageCorrectly({ baseUrl, appPort, page }));
      it(`should support ${mode === 'dev' ? 'client and ' : ''}server actions`, () =>
        supportServerAction({ baseUrl, appPort, page }));
      it('should support response api', () =>
        supportResponseAPIForServerRoot({ baseUrl, appPort, page }));
      it('support inject first screen css', () =>
        supportInjectCssFirstScreen({ baseUrl, appPort, page }));
    });
  });
}

async function renderClientRootPageCorrectly({
  baseUrl,
  appPort,
}: TestOptions) {
  const res = await fetch(`http://127.0.0.1:${appPort}${baseUrl}`);
  const pageText = await res.text();
  expect(pageText?.trim()).toContain('Get started by editing');
}

async function renderServerRootPageCorrectly({
  baseUrl,
  appPort,
}: TestOptions) {
  const res = await fetch(`http://127.0.0.1:${appPort}${baseUrl}`);
  const pageText = await res.text();
  expect(pageText).toContain('Client State');
  expect(pageText).toContain('Server State');
  expect(pageText).toContain('Dynamic Message');
  expect(pageText).toContain('countStateFromServer');
}

async function renderPageWithContext({ baseUrl, appPort, page }: TestOptions) {
  await page.goto(`http://localhost:${appPort}${baseUrl}`, {
    waitUntil: ['networkidle0'],
  });

  const useAgent = await page.$('.user-agent');
  const targetText = await page.evaluate(el => el?.textContent, useAgent);
  expect(targetText?.trim()).toEqual('string');
}

async function supportServerAction({ baseUrl, appPort, page }: TestOptions) {
  await page.goto(`http://localhost:${appPort}${baseUrl}`);

  let clientCount = await page.$eval('.client-count', el => el.textContent);
  let serverCount = await page.$eval('.server-count', el => el.textContent);
  expect(clientCount).toBe('0');
  expect(serverCount).toBe('0');

  await page.click('.client-increment');
  clientCount = await page.$eval('.client-count', el => el.textContent);
  expect(clientCount).toBe('1');

  await page.click('.server-increment');
  await page.waitForFunction(
    () =>
      !document.querySelector('.server-increment')?.hasAttribute('disabled'),
  );
  serverCount = await page.$eval('.server-count', el => el.textContent);
  expect(serverCount).toBe('1');
}

async function supportResponseAPIForServerRoot({
  baseUrl,
  appPort,
}: TestOptions) {
  const headersRes = await fetch(
    `http://127.0.0.1:${appPort}${baseUrl}?type=headers`,
  );
  expect(headersRes.headers.get('x-test')).toBe('test-value');

  const statusRes = await fetch(
    `http://127.0.0.1:${appPort}${baseUrl}?type=status`,
  );
  expect(statusRes.status).toBe(418);

  const redirectRes = await fetch(
    `http://127.0.0.1:${appPort}${baseUrl}?type=redirect`,
    { redirect: 'manual' },
  );
  expect(redirectRes.status).toBe(307);
  expect(redirectRes.headers.get('location')).toBe('/client-component-root');

  const redirectWithHeadersRes = await fetch(
    `http://127.0.0.1:${appPort}${baseUrl}?type=redirect-with-headers`,
    { redirect: 'manual' },
  );
  expect(redirectWithHeadersRes.status).toBe(301);
  expect(redirectWithHeadersRes.headers.get('location')).toBe(
    '/client-component-root',
  );
  expect(redirectWithHeadersRes.headers.get('x-redirect-test')).toBe('test');
}

async function supportResponseAPIForClientRoot({
  baseUrl,
  appPort,
}: TestOptions) {
  const headersRes = await fetch(
    `http://127.0.0.1:${appPort}${baseUrl}?type=headers`,
  );
  expect(headersRes.headers.get('x-test')).toBe('test-value');

  const statusRes = await fetch(
    `http://127.0.0.1:${appPort}${baseUrl}?type=status`,
  );
  expect(statusRes.status).toBe(418);

  const redirectRes = await fetch(
    `http://127.0.0.1:${appPort}${baseUrl}?type=redirect`,
    { redirect: 'manual' },
  );
  expect(redirectRes.status).toBe(307);
  expect(redirectRes.headers.get('location')).toBe('/server-component-root');

  const redirectWithHeadersRes = await fetch(
    `http://127.0.0.1:${appPort}${baseUrl}?type=redirect-with-headers`,
    { redirect: 'manual' },
  );
  expect(redirectWithHeadersRes.status).toBe(301);
  expect(redirectWithHeadersRes.headers.get('location')).toBe(
    '/server-component-root',
  );
  expect(redirectWithHeadersRes.headers.get('x-redirect-test')).toBe('test');
}

async function supportInjectCssFirstScreen({
  baseUrl,
  appPort,
  page,
}: TestOptions) {
  await page.goto(`http://localhost:${appPort}${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });

  // Check if the root element has the CSS styles applied
  const rootElement = await page.$('#root');
  expect(rootElement).not.toBeNull();

  // Use attribute selector to match CSS Modules hashed class names
  const backgroundColor = await page.$eval('[class*="root"]', el => {
    const styles = window.getComputedStyle(el);
    return styles.backgroundColor;
  });

  // Check if the background color matches the CSS (rgb(195, 255, 0))
  const isCorrectColor =
    backgroundColor === 'rgb(195, 255, 0)' ||
    backgroundColor === 'rgba(195, 255, 0, 1)';
  expect(isCorrectColor).toBe(true);
}

runTests({ mode: 'dev' });
runTests({ mode: 'build' });
