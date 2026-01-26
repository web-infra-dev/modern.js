import dns from 'node:dns';
import path, { join } from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

dns.setDefaultResultOrder('ipv4first');

jest.setTimeout(1000 * 20);

describe('init with SSR', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'init');
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

  test('should apply entry.server.jsx correctly', async () => {
    const res = await page.goto(`http://localhost:${appPort}`);

    expect(res?.headers()).toHaveProperty('x-custom-value', 'abc');

    const body = await res?.text();

    expect(body).toMatch('Byte-Dance');
  });

  test(`use ssr init data`, async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    const element = await page.$('#data');
    const targetText = await page.evaluate(el => el?.textContent, element);

    expect(targetText).toMatch('server');
  });

  test(`use ssr init data`, async () => {
    await page.goto(`http://localhost:${appPort}?browser=true`, {
      waitUntil: ['networkidle0'],
    });
    const element = await page.$('#data');
    const targetText = await page.evaluate(el => el?.textContent, element);

    expect(targetText).toMatch('client');
  });
});
