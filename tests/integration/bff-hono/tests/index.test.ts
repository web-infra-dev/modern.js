import dns from 'node:dns';
import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';
import 'isomorphic-fetch';

dns.setDefaultResultOrder('ipv4first');

const appDir = path.resolve(__dirname, '../');

describe('bff hono in dev', () => {
  let port = 8080;
  const SSR_PAGE = 'ssr';
  const BASE_PAGE = 'base';
  const CUSTOM_PAGE = 'custom-sdk';
  const UPLOAD_PAGE = 'upload';
  const host = `http://localhost`;
  const prefix = '/bff-api';
  let app: any;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);
    port = await getPort();
    app = await launchApp(appDir, port, {});
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  test('basic usage', async () => {
    await page.goto(`${host}:${port}/${BASE_PAGE}`, {
      timeout: 50000,
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    const text = await page.$eval('.hello', el => el?.textContent);
    const username = await page.$eval('.username', el => el?.textContent);

    expect(text).toBe('Hello Modern.js');
    expect(username).toBe('user123');
  });

  test('basic usage with ssr', async () => {
    await page.goto(`${host}:${port}/${SSR_PAGE}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    const text1 = await page.$eval('.hello', el => el?.textContent);
    expect(text1).toBe('Hello Modern.js');
  });

  test('support useContext', async () => {
    const res = await fetch(`${host}:${port}${prefix}/context`);
    const info = await res.json();
    expect(res.headers.get('x-id')).toBe('1');
    expect(info.message).toBe('Hello Modern.js');
  });

  test('support custom sdk', async () => {
    await page.goto(`${host}:${port}/${CUSTOM_PAGE}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const text = await page.$eval('.hello', el => el?.textContent);
    expect(text).toBe('Hello Custom SDK');
  });

  test('support upload', async () => {
    await page.goto(`${host}:${port}/${UPLOAD_PAGE}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const text = await page.$eval('.mock_file', el => el?.textContent);
    expect(text).toBe('mock_image.png');
  });

  test('custom res', async () => {
    await page.goto(`${host}:${port}/${BASE_PAGE}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const imgElement = await page.$('.captcha-img');
    expect(imgElement).not.toBeNull();

    const isLoaded = await imgElement!.evaluate(
      img =>
        (img as HTMLImageElement).complete &&
        (img as HTMLImageElement).naturalWidth > 0,
    );
    expect(isLoaded).toBe(true);
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});

describe('bff hono in prod', () => {
  let port = 8080;
  const SSR_PAGE = 'ssr';
  const BASE_PAGE = 'base';
  const CUSTOM_PAGE = 'custom-sdk';
  const UPLOAD_PAGE = 'upload';
  const host = `http://localhost`;
  const prefix = '/bff-api';
  let app: any;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    port = await getPort();

    await modernBuild(appDir, [], {});

    app = await modernServe(appDir, port, {});

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  test('basic usage', async () => {
    await page.goto(`${host}:${port}/${BASE_PAGE}`);
    const text1 = await page.$eval('.hello', el => el?.textContent);
    expect(text1).toBe('bff-hono');
    await new Promise(resolve => setTimeout(resolve, 300));
    const text2 = await page.$eval('.hello', el => el?.textContent);
    expect(text2).toBe('Hello Modern.js');
  });

  test('basic usage with ssr', async () => {
    await page.goto(`${host}:${port}/${SSR_PAGE}`);
    const text1 = await page.$eval('.hello', el => el?.textContent);
    expect(text1).toBe('Hello Modern.js');
  });

  test('support useContext', async () => {
    const res = await fetch(`${host}:${port}${prefix}/context`);
    const info = await res.json();
    expect(res.headers.get('x-id')).toBe('1');
    expect(info.message).toBe('Hello Modern.js');
  });

  test('support custom sdk', async () => {
    await page.goto(`${host}:${port}/${CUSTOM_PAGE}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const text = await page.$eval('.hello', el => el?.textContent);
    expect(text).toBe('Hello Custom SDK');
  });

  test('support upload', async () => {
    await page.goto(`${host}:${port}/${UPLOAD_PAGE}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const text = await page.$eval('.mock_file', el => el?.textContent);
    expect(text).toBe('mock_image.png');
  });

  test('custom res', async () => {
    await page.goto(`${host}:${port}/${BASE_PAGE}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const imgElement = await page.$('.captcha-img');
    expect(imgElement).not.toBeNull();

    const isLoaded = await imgElement!.evaluate(
      img =>
        (img as HTMLImageElement).complete &&
        (img as HTMLImageElement).naturalWidth > 0,
    );
    expect(isLoaded).toBe(true);
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});
