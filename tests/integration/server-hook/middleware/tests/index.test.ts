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

  test('should get request info correctly', async () => {
    const response = await page.goto(`http://localhost:${port}`);
    const header = response!.headers();
    const text = await response!.text();
    expect(text).toBe('hello modern');
    expect(header['x-index-middleware']).toMatch('true');
    expect(header['x-unstable-middleware']).toMatch('true');
  });

  test('should redirect correctly', async () => {
    const response = await page.goto(`http://localhost:${port}/redirect`);

    const chain = response?.request().redirectChain();

    expect(chain?.length).toBe(1);
    expect(chain?.[0].url()).toBe(`http://localhost:${port}/redirect`);
  });

  test('should set headers correctly', async () => {
    const response = await page.goto(`http://localhost:${port}/home`);
    const headers = response?.headers();

    expect(headers).toHaveProperty('x-index-name', 'home');
  });
});
