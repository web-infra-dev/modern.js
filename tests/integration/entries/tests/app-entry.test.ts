import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

describe('app-custom', () => {
  let app: unknown;
  let page: Page;
  let browser: Browser;
  let appPort: number;
  beforeAll(async () => {
    const appDir = path.join(fixtures, 'app-entry');
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

  test('main', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('index');
  });
  test('about', async () => {
    await page.goto(`http://localhost:${appPort}/about`, {
      waitUntil: ['networkidle0'],
    });
    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('about');
  });
});
