import path from 'path';
import { Page } from 'puppeteer';
import {
  getPort,
  launchApp,
  killApp,
  modernBuild,
  modernServe,
  openPage,
} from '../../../utils/modernTestUtils';
import 'isomorphic-fetch';

describe('bff express in dev', () => {
  let port = 8080;
  const SSR_PAGE = 'ssr';
  const BASE_PAGE = 'base';
  const host = `http://localhost`;
  const prefix = '/bff-api';
  const appPath = path.resolve(__dirname, '../');
  let app: any;
  let page: Page;

  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);
    port = await getPort();
    app = await launchApp(appPath, port, {
      cwd: appPath,
    });
    page = await openPage();
  });

  test('basic usage', async () => {
    await page.goto(`${host}:${port}/${BASE_PAGE}`);
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

  afterAll(async () => {
    await killApp(app);
    await page.close();
  });
});

describe('bff express in prod', () => {
  let port = 8080;
  const SSR_PAGE = 'ssr';
  const BASE_PAGE = 'base';
  const host = `http://localhost`;
  const prefix = '/bff-api';
  const appPath = path.resolve(__dirname, '../');
  let app: any;
  let page: Page;

  beforeAll(async () => {
    port = await getPort();

    await modernBuild(appPath, [], {
      cwd: appPath,
    });

    app = await modernServe(appPath, port, {
      cwd: appPath,
    });

    page = await openPage();
  });

  // FIXME: Skipped because this test often times out on Windows
  test.skip('basic usage', async () => {
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
  test.skip('basic usage with ssr', async () => {
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

  afterAll(async () => {
    await killApp(app);
    await page.close();
  });
});
