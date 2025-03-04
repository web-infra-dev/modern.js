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

describe('dev', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  if (!isVersionAtLeast18()) {
    test('should skip in lower node version', () => {
      expect(true).toBe(true);
    });

    return;
  }

  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(
      appDir,
      appPort,
      {},
      {
        BUNDLER: 'webpack',
      },
    );
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });

  describe('client component root', () => {
    const baseUrl = `client-component-root`;

    it('should render page correctly', () =>
      renderClientRootPageCorrectly({ baseUrl, appPort, page }));
    it('should render page with context correctly', () =>
      renderPageWithContext({ baseUrl, appPort, page }));
    it('should support response api', () =>
      supportResponseAPIForClientRoot({ baseUrl, appPort, page }));
  });

  describe('server component root', () => {
    const baseUrl = `server-component-root`;
    it('should render page correctly', () =>
      renderServerRootPageCorrectly({ baseUrl, appPort, page }));
    it('should support client and server actions', () =>
      supportServerAction({ baseUrl, appPort, page }));
    it('should support response api', () =>
      supportResponseAPIForServerRoot({ baseUrl, appPort, page }));
  });
});

describe('build', () => {
  let appPort: number;
  let app: unknown;
  let page: Page;
  let browser: Browser;
  const errors: string[] = [];

  if (!isVersionAtLeast18()) {
    test('should skip in lower node version', () => {
      expect(true).toBe(true);
    });

    return;
  }

  beforeAll(async () => {
    appPort = await getPort();
    await modernBuild(appDir, [], {
      env: {
        BUNDLER: 'webpack',
      },
    });
    app = await modernServe(appDir, appPort, {
      cwd: appDir,
    });
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    page.on('pageerror', error => {
      errors.push(error.message);
    });
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });

  describe('client component root', () => {
    const baseUrl = `client-component-root`;

    it('should render page correctly', () =>
      renderClientRootPageCorrectly({ baseUrl, appPort, page }));
    it('should render page with context correctly', () =>
      renderPageWithContext({ baseUrl, appPort, page }));
    it('should support response api', () =>
      supportResponseAPIForClientRoot({ baseUrl, appPort, page }));
  });

  describe('server component root', () => {
    const baseUrl = `server-component-root`;
    it('should render page correctly', () =>
      renderServerRootPageCorrectly({ baseUrl, appPort, page }));
    it('should support server action', () =>
      supportServerAction({ baseUrl, appPort, page }));
    it('should support response api', () =>
      supportResponseAPIForServerRoot({ baseUrl, appPort, page }));
  });
});

interface TestOptions {
  baseUrl: string;
  appPort: number;
  page: Page;
}

async function renderClientRootPageCorrectly({
  baseUrl,
  appPort,
}: TestOptions) {
  const res = await fetch(`http://127.0.0.1:${appPort}/${baseUrl}`);

  const pageText = await res.text();

  expect(pageText?.trim()).toContain('Get started by editing');
}

async function renderServerRootPageCorrectly({
  baseUrl,
  appPort,
}: TestOptions) {
  const res = await fetch(`http://127.0.0.1:${appPort}/${baseUrl}`);

  const pageText = await res.text();
  expect(pageText).toContain('Client State');
  expect(pageText).toContain('Server State');
  expect(pageText).toContain('Dynamic Message');
  expect(pageText).toContain('countStateFromServer');
}

async function renderPageWithContext({ baseUrl, appPort, page }: TestOptions) {
  await page.goto(`http://localhost:${appPort}/${baseUrl}`, {
    waitUntil: ['networkidle0'],
  });

  const useAgent = await page.$('.user-agent');
  const targetText = await page.evaluate(el => el?.textContent, useAgent);
  expect(targetText?.trim()).toEqual('string');
}

async function supportServerAction({ baseUrl, appPort, page }: TestOptions) {
  await page.goto(`http://localhost:${appPort}/${baseUrl}`);

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
  page,
}: TestOptions) {
  const headersRes = await fetch(
    `http://127.0.0.1:${appPort}/${baseUrl}?type=headers`,
  );
  expect(headersRes.headers.get('x-test')).toBe('test-value');

  // Test setStatus
  const statusRes = await fetch(
    `http://127.0.0.1:${appPort}/${baseUrl}?type=status`,
  );
  expect(statusRes.status).toBe(418);

  // Test redirect with status code
  const redirectRes = await fetch(
    `http://127.0.0.1:${appPort}/${baseUrl}?type=redirect`,
    { redirect: 'manual' },
  );
  expect(redirectRes.status).toBe(307);
  expect(redirectRes.headers.get('location')).toBe('/client-component-root');

  // Test redirect with init object
  const redirectWithHeadersRes = await fetch(
    `http://127.0.0.1:${appPort}/${baseUrl}?type=redirect-with-headers`,
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
  page,
}: TestOptions) {
  const headersRes = await fetch(
    `http://127.0.0.1:${appPort}/${baseUrl}?type=headers`,
  );
  expect(headersRes.headers.get('x-test')).toBe('test-value');

  // Test setStatus
  const statusRes = await fetch(
    `http://127.0.0.1:${appPort}/${baseUrl}?type=status`,
  );
  expect(statusRes.status).toBe(418);

  // Test redirect with status code
  const redirectRes = await fetch(
    `http://127.0.0.1:${appPort}/${baseUrl}?type=redirect`,
    { redirect: 'manual' },
  );
  expect(redirectRes.status).toBe(307);
  expect(redirectRes.headers.get('location')).toBe('/server-component-root');

  // Test redirect with init object
  const redirectWithHeadersRes = await fetch(
    `http://127.0.0.1:${appPort}/${baseUrl}?type=redirect-with-headers`,
    { redirect: 'manual' },
  );
  expect(redirectWithHeadersRes.status).toBe(301);
  expect(redirectWithHeadersRes.headers.get('location')).toBe(
    '/server-component-root',
  );
  expect(redirectWithHeadersRes.headers.get('x-redirect-test')).toBe('test');
}
