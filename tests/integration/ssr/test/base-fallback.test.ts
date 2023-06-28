import dns from 'node:dns';
import path, { join } from 'path';
import puppeteer, { Page, Browser } from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

dns.setDefaultResultOrder('ipv4first');
const fixtureDir = path.resolve(__dirname, '../fixtures');

async function basicUsage(page: Page, appPort: number) {
  await page.setExtraHTTPHeaders({
    'x-modern-ssr-fallback': '1',
  });
  const response = await page.goto(`http://localhost:${appPort}`, {
    waitUntil: ['networkidle0'],
  });
  const text = await response!.text();
  expect(text).toMatch('<!--<?- html ?>-->');
}

describe('Traditional SSR c', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'fallback');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test(`basic usage`, async () => {
    await basicUsage(page, appPort);
  });
});

describe('Traditional SSR with rspack', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'fallback');
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, { BUNDLER: 'rspack' });

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test(`basic usage`, async () => {
    await basicUsage(page, appPort);
  });
});
