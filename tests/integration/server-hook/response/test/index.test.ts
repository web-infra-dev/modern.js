import path from 'path';
import { Page } from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  openPage,
} from '../../../../utils/modernTestUtils';

const appPath = path.resolve(__dirname, '../');

describe('test status code page', () => {
  let app: any;
  let port: number;
  let page: Page;

  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);
    port = await getPort();

    app = await launchApp(appPath, port);
    page = await openPage();
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
      await page.deleteCookie();
    }
    await page.close();
  });

  it('should response header work correctly', async () => {
    const response = await page.goto(`http://localhost:${port}/header`);
    const headers = response!.headers();
    const text = await response!.text();
    expect(headers['x-modern-name']).toBe('hello-modern');
    expect(text).toBe('18yearold');
  });

  it('should response status work correctly', async () => {
    const response = await page.goto(`http://localhost:${port}/status`);
    expect(response!.status()).toBe(201);
  });

  it('should response cookies apply work correctly', async () => {
    const response = await page.goto(`http://localhost:${port}/cookies-apply`);
    const headers = response!.headers();
    const cookie = headers['set-cookie'];
    expect(cookie).toMatch('x-test-language=zh-en');
    expect(cookie).toMatch('x-test-city=zhejiang');
  });

  it('should response cookies clear work correctly', async () => {
    const response = await page.goto(`http://localhost:${port}/cookies-clear`);
    const headers = response!.headers();
    const cookie = headers['set-cookie'];
    expect(cookie).toBeUndefined();
  });

  it('should response raw work correctly', async () => {
    const response = await page.goto(`http://localhost:${port}/raw`);
    const text = await response!.text();
    expect(text).toBe('hello world');

    const headers = response!.headers();
    expect(headers['x-modern-name']).toBe('hello-modern');
    expect(response!.status()).toBe(201);
  });
});
