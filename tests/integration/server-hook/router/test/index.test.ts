import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';

const appPath = path.resolve(__dirname, '../');

describe('test status code page', () => {
  let app: any;
  let port: number;
  let page: Page;
  let browser: Browser;
  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);
    port = await getPort();

    app = await launchApp(appPath, port);
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
    await page.close();
    await browser.close();
  });

  it('should router rewrite correctly ', async () => {
    await page.goto(`http://localhost:${port}/rewrite`);
    const text = await page.$eval('#root', el => el?.textContent);
    expect(text).toMatch('Entry Page');
  });

  it.skip('should router redirect correctly ', async () => {
    const response = await page.goto(`http://localhost:${port}/redirect`);
    const text = await response!.text();
    expect(text).toMatch('Modern Web Development');
  });
});
