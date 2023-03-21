import path from 'path';
import { Page } from 'puppeteer';
import {
  getPort,
  launchApp,
  killApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';
import 'isomorphic-fetch';

declare const page: Page;

describe('bff express in dev', () => {
  let port = 8080;
  const host = `http://localhost`;
  const appPath = path.resolve(__dirname, '../');
  let app: any;

  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);
    port = await getPort();
    app = await launchApp(appPath, port, {
      cwd: appPath,
    });
  });

  test('stream ssr with bff handle web in development', async () => {
    await page.goto(`${host}:${port}?name=bytedance`, {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$eval('#item', el => el.textContent);
    expect(text).toMatch('name: bytedance, age: 18');
  });

  test('stream ssr with bff handle web, client nav in development', async () => {
    await page.goto(`${host}:${port}/user`, {
      waitUntil: ['networkidle0'],
    });
    await page.click('#home-btn');
    await new Promise(resolve => setTimeout(resolve, 300));
    const text = await page.$eval('#item', el => el.textContent);
    expect(text).toMatch('name: modernjs, age: 18');
  });

  afterAll(async () => {
    await killApp(app);
  });
});

describe('bff express in prod', () => {
  let port = 8080;
  const host = `http://localhost`;
  const appPath = path.resolve(__dirname, '../');
  let app: any;

  beforeAll(async () => {
    port = await getPort();

    await modernBuild(appPath, [], {
      cwd: appPath,
    });

    app = await modernServe(appPath, port, {
      cwd: appPath,
    });
  });

  test('stream ssr with bff handle web in prod', async () => {
    await page.goto(`${host}:${port}?name=bytedance`, {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$eval('#item', el => el.textContent);
    expect(text).toMatch('name: bytedance, age: 18');
  });

  test('stream ssr with bff handle web, client nav in prod', async () => {
    await page.goto(`${host}:${port}/user`, {
      waitUntil: ['networkidle0'],
    });
    await page.click('#home-btn');
    await new Promise(resolve => setTimeout(resolve, 300));
    const text = await page.$eval('#item', el => el.textContent);
    expect(text).toMatch('name: modernjs, age: 18');
  });

  afterAll(async () => {
    await killApp(app);
  });
});
