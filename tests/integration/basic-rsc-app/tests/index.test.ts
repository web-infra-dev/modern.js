import path from 'path';
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
  });

  describe('server component root', () => {
    const baseUrl = `server-component-root`;
    it('should render page correctly', () =>
      renderServerRootPageCorrectly({ baseUrl, appPort, page }));
    it('should support client and server actions', () =>
      supportServerAction({ baseUrl, appPort, page }));
  });
});

describe('build', () => {
  let appPort: number;
  let app: unknown;
  let page: Page;
  let browser: Browser;
  const errors: string[] = [];
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
  });

  describe('server component root', () => {
    const baseUrl = `server-component-root`;
    it('should render page correctly', () =>
      renderServerRootPageCorrectly({ baseUrl, appPort, page }));
    it('should support server action', () =>
      supportServerAction({ baseUrl, appPort, page }));
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
