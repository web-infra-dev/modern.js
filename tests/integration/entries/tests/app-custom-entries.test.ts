import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

describe('app-custom-entries', () => {
  let app: unknown;
  let page: Page;
  let browser: Browser;
  let appPort: number;
  beforeAll(async () => {
    const appDir = path.join(fixtures, 'app-custom-entries');
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
    expect(targetText?.trim()).toEqual('Modern APP');
  });
  test('entry-1', async () => {
    await page.goto(`http://localhost:${appPort}/entry-1`, {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$('#text');
    const targetText = await page.evaluate(el => el?.textContent, text);
    const wrapper = await page.$('#wrapper');
    const targetTextWrapper = await page.evaluate(
      el => el?.textContent,
      wrapper,
    );
    const server = await page.$('#server');
    const targetTextServer = await page.evaluate(el => el?.textContent, server);
    expect(targetText?.trim()).toEqual('Modern APP-1');
    expect(targetTextWrapper?.trim()).toEqual('custom entry-1');
    expect(targetTextServer?.trim()).toEqual('custom entry-1-server');
  });
});
