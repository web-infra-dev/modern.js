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

// Skip flaky tests on CI, but run them locally
const conditionalTest = process.env.LOCAL_TEST === 'true' ? test : test.skip;

dns.setDefaultResultOrder('ipv4first');

const apiAppDir = path.resolve(__dirname, '../bff-api-app');
const appDir = path.resolve(__dirname, '../bff-client-app');
const indepAppDir = path.resolve(__dirname, '../bff-indep-client-app');

const testApiWorked = async ({
  host,
  port,
  prefix,
}: {
  host: string;
  port: number;
  prefix: string;
}) => {
  const expectedText = 'Hello get bff-api-app';
  const res = await fetch(`${host}:${port}${prefix}`);
  expect(res.status).toBe(200);
  const text = await res.text();
  expect(text).toBe(JSON.stringify({ message: expectedText }));
};
describe('corss project bff', () => {
  describe('bff client-app in dev', () => {
    const expectedText = 'Hello get bff-api-app';
    const port = 3401;
    const apiPort = 3399;
    const SSR_PAGE = 'ssr';
    const BASE_PAGE = 'base';
    const CUSTOM_PAGE = 'custom-sdk';
    const UPLOAD_PAGE = 'upload';
    const host = `http://localhost`;
    const prefix = '/api-app';
    let app: any;
    let apiApp: any;
    let page: Page;
    let browser: Browser;

    beforeAll(async () => {
      jest.setTimeout(1000 * 60 * 2);
      apiApp = await launchApp(apiAppDir, apiPort, {});

      jest.setTimeout(1000 * 60 * 2);
      app = await launchApp(appDir, port, {});
      browser = await puppeteer.launch(launchOptions as any);
      page = await browser.newPage();
    });

    test('api-app should works', async () => {
      await testApiWorked({
        host,
        port: apiPort,
        prefix,
      });
    });

    test('basic usage', async () => {
      await page.goto(`${host}:${port}/${BASE_PAGE}`, {
        timeout: 50000,
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      const text = await page.$eval('.hello', el => el?.textContent);
      expect(text).toBe(expectedText);
    });

    conditionalTest('basic usage with csr', async () => {
      await page.goto(`${host}:${port}/${SSR_PAGE}`);
      await page.waitForFunction(() => {
        const loadingEl = document.querySelector('.loading');
        const helloEl = document.querySelector('.hello');
        return !loadingEl && helloEl;
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      const text1 = await page.$eval('.hello', el => el?.textContent);
      expect(text1).toBe(expectedText);
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

    afterAll(async () => {
      await killApp(app);
      await killApp(apiApp);
      await page.close();
      await browser.close();
    });
  });

  describe('bff client-app in prod', () => {
    const expectedText = 'Hello get bff-api-app';
    const port = 3401;
    const apiPort = 3399;
    const SSR_PAGE = 'ssr';
    const BASE_PAGE = 'base';
    const CUSTOM_PAGE = 'custom-sdk';
    const UPLOAD_PAGE = 'upload';
    const host = `http://127.0.0.1`;
    const prefix = '/api-app';
    let app: any;
    let apiApp: any;
    let page: Page;
    let browser: Browser;

    beforeAll(async () => {
      await modernBuild(apiAppDir, [], {});
      apiApp = await modernServe(apiAppDir, apiPort, {});

      await modernBuild(appDir, [], {});
      app = await modernServe(appDir, port, {});

      browser = await puppeteer.launch(launchOptions as any);
      page = await browser.newPage();

      page.on('console', msg => {
        // 打印所有类型的日志
        console.log('[browser]', msg.type(), msg.text());
      });
    });

    test('api-app should works', async () => {
      await testApiWorked({
        host,
        port: apiPort,
        prefix,
      });
    });

    test('basic usage', async () => {
      await page.goto(`${host}:${port}/${BASE_PAGE}`, {
        timeout: 50000,
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      const text = await page.$eval('.hello', el => el?.textContent);
      expect(text).toBe(expectedText);
    });

    conditionalTest('basic usage with csr', async () => {
      await page.goto(`${host}:${port}/${SSR_PAGE}`);
      await page.waitForFunction(() => {
        const loadingEl = document.querySelector('.loading');
        const helloEl = document.querySelector('.hello');
        return !loadingEl && helloEl;
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      const text1 = await page.$eval('.hello', el => el?.textContent);
      expect(text1).toBe(expectedText);
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

    afterAll(async () => {
      await killApp(app);
      await killApp(apiApp);
      await page.close();
      await browser.close();
    });
  });

  describe('bff indep-client-app in dev', () => {
    const apiPort = 3399;
    let port = 8080;
    const SSR_PAGE = 'ssr';
    const BASE_PAGE = 'base';
    const CUSTOM_PAGE = 'custom-sdk';
    const UPLOAD_PAGE = 'upload';
    const host = `http://localhost`;
    const prefix = '/api';
    let indepClientApp: any;
    let apiApp: any;
    let page: Page;
    let browser: Browser;

    beforeAll(async () => {
      jest.setTimeout(1000 * 60 * 2);
      apiApp = await launchApp(apiAppDir, apiPort, {});

      jest.setTimeout(1000 * 60 * 2);
      port = await getPort();
      indepClientApp = await launchApp(indepAppDir, port, {});
      browser = await puppeteer.launch(launchOptions as any);
      page = await browser.newPage();

      page.on('console', msg => {
        // 打印所有类型的日志
        console.log('[browser]', msg.type(), msg.text());
      });
    });

    test('basic usage', async () => {
      await page.goto(`${host}:${port}/${BASE_PAGE}`, {
        timeout: 50000,
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      const text = await page.$eval('.hello', el => el?.textContent);
      expect(text).toBe('hello：Hello get bff-api-app');
    });

    test('basic usage with csr', async () => {
      await page.goto(`${host}:${port}/${SSR_PAGE}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const text1 = await page.$eval('.hello', el => el?.textContent);
      expect(text1).toBe('node-fetch：Hello get bff-api-app');
    });

    test('support custom sdk', async () => {
      await page.goto(`${host}:${port}/${CUSTOM_PAGE}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      const text = await page.$eval('.hello', el => el?.textContent);
      expect(text).toBe('interceptor return：Hello Custom SDK');
    });

    test('support upload', async () => {
      await page.goto(`${host}:${port}/${UPLOAD_PAGE}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const text = await page.$eval('.mock_file', el => el?.textContent);
      expect(text).toBe('mock_image.png');
    });

    test('bff response should not be compressed', async () => {
      const pageRes = await fetch(`${host}:${port}/${BASE_PAGE}`);
      expect(pageRes.headers.get('content-encoding')).toBe('gzip');
      const bffRes = await fetch(`${host}:${port}${prefix}`);
      expect(bffRes.headers.get('content-encoding')).toBeNull();
    });

    afterAll(async () => {
      await killApp(indepClientApp);
      await killApp(apiApp);
      await page.close();
      await browser.close();
    });
  });

  describe('bff indep-client-app in prod', () => {
    const apiPort = 3399;
    let port = 8080;
    const SSR_PAGE = 'ssr';
    const BASE_PAGE = 'base';
    const CUSTOM_PAGE = 'custom-sdk';
    const UPLOAD_PAGE = 'upload';
    const host = `http://localhost`;
    let indepClientApp: any;
    let apiApp: any;
    let page: Page;
    let browser: Browser;

    beforeAll(async () => {
      await modernBuild(apiAppDir, [], {});
      apiApp = await modernServe(apiAppDir, apiPort, {});

      port = await getPort();
      await modernBuild(indepAppDir, [], {});
      indepClientApp = await modernServe(indepAppDir, port, {});

      browser = await puppeteer.launch(launchOptions as any);
      page = await browser.newPage();
    });

    test('basic usage', async () => {
      await page.goto(`${host}:${port}/${BASE_PAGE}`, {
        timeout: 50000,
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      const text = await page.$eval('.hello', el => el?.textContent);
      expect(text).toBe('hello：Hello get bff-api-app');
    });

    test('basic usage with csr', async () => {
      await page.goto(`${host}:${port}/${SSR_PAGE}`);
      const text1 = await page.$eval('.hello', el => el?.textContent);
      expect(text1).toBe('node-fetch：Hello get bff-api-app');
    });

    test('support custom sdk', async () => {
      await page.goto(`${host}:${port}/${CUSTOM_PAGE}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const text = await page.$eval('.hello', el => el?.textContent);
      expect(text).toBe('interceptor return：Hello Custom SDK');
    });

    test('support upload', async () => {
      await page.goto(`${host}:${port}/${UPLOAD_PAGE}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const text = await page.$eval('.mock_file', el => el?.textContent);
      expect(text).toBe('mock_image.png');
    });

    afterAll(async () => {
      await killApp(indepClientApp);
      await killApp(apiApp);
      await page.close();
      await browser.close();
    });
  });
});
