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

describe('bff express in dev', () => {
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
    // Reduce the probability of timeout on windows CI
    await new Promise(resolve => setTimeout(resolve, 3000));
    const text = await page.$eval('.hello', el => el?.textContent);
    expect(text).toBe('Hello Modern.js');
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

  test('support _app.ts', async () => {
    const res = await fetch(`${host}:${port}${prefix}/foo`);
    const text = await res.text();
    expect(text).toBe('foo');
  });

  test('support custom sdk', async () => {
    await page.goto(`${host}:${port}/${CUSTOM_PAGE}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const text = await page.$eval('.hello', el => el?.textContent);
    expect(text).toBe('Hello Custom SDK');
  });

  test('support uoload', async () => {
    await page.goto(`${host}:${port}/${UPLOAD_PAGE}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const text = await page.$eval('.mock_file', el => el?.textContent);
    expect(text).toBe('mock_image.png');
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});

describe('bff express in prod', () => {
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

  // FIXME: Skipped because this test often times out on Windows
  test('basic usage', async () => {
    await page.goto(`${host}:${port}/${BASE_PAGE}`);
    const text1 = await page.$eval('.hello', el => el?.textContent);
    expect(text1).toBe('bff-express');
    await new Promise(resolve => setTimeout(resolve, 300));
    const text2 = await page.$eval('.hello', el => el?.textContent);
    expect(text2).toBe('Hello Modern.js');
  });

  // FIXME: This test unit is probably crazy
  // when you run it on local, It is normal.
  // when you run it on test, It is crazy.
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

  test('support _app.ts', async () => {
    const res = await fetch(`${host}:${port}${prefix}/foo`);
    const text = await res.text();
    expect(text).toBe('foo');
  });

  test('support custom sdk', async () => {
    await page.goto(`${host}:${port}/${CUSTOM_PAGE}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const text = await page.$eval('.hello', el => el?.textContent);
    expect(text).toBe('Hello Custom SDK');
  });

  test('support uoload', async () => {
    await page.goto(`${host}:${port}/${UPLOAD_PAGE}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const text = await page.$eval('.mock_file', el => el?.textContent);
    expect(text).toBe('mock_image.png');
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});
