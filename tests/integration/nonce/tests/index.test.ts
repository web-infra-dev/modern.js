import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const appPath = path.resolve(__dirname, '../');

describe('test nonce', () => {
  let app: any;
  let port: number;
  let page: Page;
  let browser: Browser;
  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    await page.deleteCookie();
    port = await getPort();

    app = await launchApp(appPath, port);
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
    await page.close();
    await browser.close();
  });

  test('should inject nonce correctly', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.goto(`http://localhost:${port}`);
    const scriptArr = await page.$$eval('head > script', scripts =>
      scripts
        .filter(script => script.type !== 'application/json')
        .map(script => {
          return script.nonce;
        }),
    );

    const nonceArr = scriptArr.filter(nonce => nonce === 'test-nonce');
    expect(nonceArr.length).toBe(scriptArr.length);
  });
});
