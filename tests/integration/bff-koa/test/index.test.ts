import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
  getPort,
  launchApp,
  killApp,
  modernBuild,
  modernServe,
  launchOptions,
} from '../../../utils/modernTestUtils';
import 'isomorphic-fetch';

describe('bff koa in dev', () => {
  let port = 8080;
  const host = `http://localhost`;
  const appPath = path.resolve(__dirname, '../');
  let app: any;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);
    port = await getPort();
    app = await launchApp(appPath, port, {
      cwd: appPath,
    });
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  test('stream ssr with bff handle web', async () => {
    await page.goto(`${host}:${port}?name=bytedance`, {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$eval('#item', el => el?.textContent);
    expect(text).toMatch('name: bytedance, age: 18');
  });

  test('stream ssr with bff handle web, client nav', async () => {
    await page.goto(`${host}:${port}/user`, {
      waitUntil: ['networkidle0'],
    });
    await page.click('#home-btn');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const text = await page.$eval('#item', el => el?.textContent);
    expect(text).toMatch('name: modernjs, age: 18');
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});

describe('bff express in prod', () => {
  let port = 8080;
  const host = `http://localhost`;
  const appPath = path.resolve(__dirname, '../');
  let app: any;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    port = await getPort();

    await modernBuild(appPath, [], {
      cwd: appPath,
    });

    app = await modernServe(appPath, port, {
      cwd: appPath,
    });
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  test('stream ssr with bff handle web', async () => {
    await page.goto(`${host}:${port}?name=bytedance`, {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$eval('#item', el => el?.textContent);
    expect(text).toMatch('name: bytedance, age: 18');
  });

  test('stream ssr with bff handle web, client nav', async () => {
    await page.goto(`${host}:${port}/user`, {
      waitUntil: ['networkidle0'],
    });
    await page.click('#home-btn');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const text = await page.$eval('#item', el => el?.textContent);
    expect(text).toMatch('name: modernjs, age: 18');
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});
