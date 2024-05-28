import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';

const appPath = path.resolve(__dirname, '../');

describe('test new middleware run correctly', () => {
  let app: any;
  let port: number;
  let page: Page;
  let browser: Browser;
  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
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

  test('should request "/" correctly', async () => {
    const url = `http://localhost:${port}`;
    const res = await page.goto(url);

    const headers = res?.headers();
    const body = await res?.text();

    expect(body).toMatch('Liming');

    expect(headers).toHaveProperty('server-timing');

    expect(body).toMatch(/lang="en"/);

    expect(headers).toHaveProperty('x-custom-value', 'modern');
  });

  test('should redirect corretly', async () => {
    const url = `http://localhost:${port}/?unlogin=1`;
    const res = await page.goto(url);

    const body = await res?.text();
    const headers = res?.headers();
    const chain = res?.request().redirectChain();

    expect(chain?.length).toBe(1);

    expect(body).toMatch('Login');

    expect(body).toMatch(/lang="en"/);

    expect(headers).toHaveProperty('x-custom-value', 'modern');
  });
});
