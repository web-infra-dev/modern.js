import path, { join } from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

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

  // FIXME: Skipped because this test often times out
  test.skip(`use ssr init data`, async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    const element = await page.$('#data');
    const targetText = await page.evaluate(el => el?.textContent, element);

    expect(targetText).toMatch('server');
  });

  // FIXME: Skipped because this test often times out
  test.skip(`use ssr init data`, async () => {
    await page.goto(`http://localhost:${appPort}?browser=true`, {
      waitUntil: ['networkidle0'],
    });
    const element = await page.$('#data');
    const targetText = await page.evaluate(el => el?.textContent, element);

    expect(targetText).toMatch('client');
  });
});
