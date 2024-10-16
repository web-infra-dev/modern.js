import dns from 'node:dns';
import path from 'path';
import axios from 'axios';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';

dns.setDefaultResultOrder('ipv4first');

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

  test('should replace body when request is post', async () => {
    const url = `http://localhost:${port}/`;

    const message = 'Hello ABC';

    const response = await axios.post(url, message, {
      responseType: 'text',
    });

    const body = response.data;

    expect(body).toMatch(message);
  });

  test('should replace request url when request url contains modify=1', async () => {
    const url = `http://localhost:${port}/?modify=1`;

    const message = '?modify=222';

    const response = await axios.get(url, {
      responseType: 'text',
    });

    const body = response.data;

    expect(body).toMatch(message);
  });

  test('should get loaderContext correctly', async () => {
    const url = `http://localhost:${port}/`;
    const response = await axios.get(url);
    const body = response.data;
    expect(body).toMatch('Liming');
    await page.goto(`http://localhost:${port}/login`, {
      waitUntil: ['networkidle0'],
    });

    const element = await page.$('.to-home');
    await element?.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    const rootElm = await page.$('#root');
    const targetText = await page.evaluate(el => el?.textContent, rootElm);
    expect(targetText?.trim()).toEqual('Hello Liming');
  });
});
