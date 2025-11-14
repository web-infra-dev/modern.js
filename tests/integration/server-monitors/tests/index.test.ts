import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const appPath = path.resolve(__dirname, '../');

describe('test status code page', () => {
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

  test('should get monitor in loader and component', async () => {
    await page.goto(`http://localhost:${port}`);
    const runtimeEl = await page.$('#runtimeSign');
    const runtimeText = await page.evaluate(el => el?.textContent, runtimeEl);
    expect(runtimeText).toBe('monitors exist in RuntimeContext: 1');

    const indexEl = await page.$('#indexSign');
    const indexText = await page.evaluate(el => el?.textContent, indexEl);
    expect(indexText).toBe('monitors exist in page index: 1');

    await page.click('#toUser');

    await page.waitForSelector('#userSign');
    const navigateEl = await page.$('#userSign');
    const navigateText = await page.evaluate(el => el?.textContent, navigateEl);
    expect(navigateText?.trim()).toEqual('monitors exist in page user: 1');
  });
});
