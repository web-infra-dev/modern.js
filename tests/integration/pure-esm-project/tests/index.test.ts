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

rstest.setConfig({ testTimeout: 1000 * 60 * 2, hookTimeout: 1000 * 60 * 2 });

const appDir = path.resolve(__dirname, '../');
dns.setDefaultResultOrder('ipv4first');

async function waitForApiInfoReady(
  host: string,
  port: number,
  timeout = 15_000,
) {
  const deadline = Date.now() + timeout;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${host}:${port}/api/info`);
      const text = await response.text();
      const data = JSON.parse(text);

      if (response.ok && data?.url === '/api/info') {
        return;
      }

      lastError = new Error(`Unexpected /api/info response: ${text}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  throw lastError ?? new Error('Timed out waiting for /api/info');
}

async function expectApiInfo(host: string, port: number) {
  const res = await fetch(`${host}:${port}/api/info`);
  const data = await res.json();

  expect(data).toEqual({
    company: 'bytedance',
    addRes: 3,
    url: '/api/info',
    user: 'modern.js',
  });
}

describe('pure-esm-project in dev', () => {
  let port = 8080;
  const host = `http://localhost`;
  let app: any;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    port = await getPort();
    app = await launchApp(appDir, port);
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    await waitForApiInfoReady(host, port);
  });

  test('stream ssr with bff handle web', async () => {
    await page.goto(`${host}:${port}?name=bytedance`, {
      waitUntil: ['networkidle0'],
    });
    await page.waitForSelector('#data');
    const text = await page.$eval('#data', el => el?.textContent);
    expect(text).toMatch('name: bytedance, age: 18');
  });

  test('stream ssr with bff handle web, client nav', async () => {
    await page.goto(`${host}:${port}/user`, {
      waitUntil: ['networkidle0'],
    });
    await page.waitForSelector('#home-btn');
    await page.click('#home-btn');
    await page.waitForSelector('#data');
    const text = await page.$eval('#data', el => el?.textContent);
    expect(text).toMatch('name: modernjs, age: 18');
  });

  test('api service should serve normally', async () => {
    await expectApiInfo(host, port);
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});

describe('pure-esm-project in prod', () => {
  let port = 8080;
  const host = `http://localhost`;
  let app: any;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    port = await getPort();

    await modernBuild(appDir, [], {});

    app = await modernServe(appDir, port, {});
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    await waitForApiInfoReady(host, port);
  });

  test('stream ssr with bff handle web', async () => {
    await page.goto(`${host}:${port}?name=bytedance`, {
      waitUntil: ['networkidle0'],
    });
    await page.waitForSelector('#data');
    const text = await page.$eval('#data', el => el?.textContent);
    expect(text).toMatch('name: bytedance, age: 18');
  });

  test('stream ssr with bff handle web, client nav', async () => {
    await page.goto(`${host}:${port}/user`, {
      waitUntil: ['networkidle0'],
    });
    await page.waitForSelector('#home-btn');
    await page.click('#home-btn');
    await page.waitForSelector('#data');
    const text = await page.$eval('#data', el => el?.textContent);
    expect(text).toMatch('name: modernjs, age: 18');
  });

  test('api service should serve normally', async () => {
    await expectApiInfo(host, port);
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});
