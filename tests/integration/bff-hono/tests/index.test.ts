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

dns.setDefaultResultOrder('ipv4first');

const appDir = path.resolve(__dirname, '../');
const host = 'http://localhost';
const ERROR_PAGE = 'error';

describe('bff hono tests', () => {
  describe('bff hono in dev', () => {
    let port = 8080;
    const SSR_PAGE = 'ssr';
    const BASE_PAGE = 'base';
    const CUSTOM_PAGE = 'custom-sdk';
    const UPLOAD_PAGE = 'upload';
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
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.hello');
          return el && el.textContent !== null && el.textContent !== 'bff-hono';
        },
        { timeout: 10000 },
      );
      const text = await page.$eval('.hello', el => el?.textContent);
      const username = await page.$eval('.username', el => el?.textContent);

      expect(text).toBe('Hello Modern.js');
      expect(username).toBe('user123');
    });

    test('basic usage with ssr', async () => {
      await page.goto(`${host}:${port}/${SSR_PAGE}`);
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.hello');
          return el && el.textContent !== null && el.textContent !== 'bff-hono';
        },
        { timeout: 10000 },
      );
      const text1 = await page.$eval('.hello', el => el?.textContent);
      expect(text1).toBe('Hello Modern.js');
    });

    test('support useContext', async () => {
      const res = await fetch(`${host}:${port}${prefix}/context`);
      const info = await res.json();
      expect(res.headers.get('x-id')).toBe('1');
      expect(info.message).toBe('Hello Modern.js');
      expect(info.userid).toBe(42);
    });

    test('support custom sdk', async () => {
      await page.goto(`${host}:${port}/${CUSTOM_PAGE}`);
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.hello');
          return el && el.textContent !== null && el.textContent !== 'bff-hono';
        },
        { timeout: 10000 },
      );
      const text = await page.$eval('.hello', el => el?.textContent);
      expect(text).toBe('Hello Custom SDK');
    });

    test('support uoload', async () => {
      await page.goto(`${host}:${port}/${UPLOAD_PAGE}`);
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.mock_file');
          return el && el.textContent !== null && el.textContent.trim() !== '';
        },
        { timeout: 10000 },
      );
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
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.hello');
          return (
            el &&
            el.textContent !== null &&
            el.textContent === 'Hello Modern.js'
          );
        },
        { timeout: 10000 },
      );
      const text2 = await page.$eval('.hello', el => el?.textContent);
      expect(text2).toBe('Hello Modern.js');
    });

    test('basic usage with ssr', async () => {
      await page.goto(`${host}:${port}/${SSR_PAGE}`);
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.hello');
          return el && el.textContent !== null && el.textContent !== 'bff-hono';
        },
        { timeout: 10000 },
      );
      const text1 = await page.$eval('.hello', el => el?.textContent);
      expect(text1).toBe('Hello Modern.js');
    });

    test('support useContext', async () => {
      const res = await fetch(`${host}:${port}${prefix}/context`);
      const info = await res.json();
      expect(res.headers.get('x-id')).toBe('1');
      expect(info.message).toBe('Hello Modern.js');
      expect(info.userid).toBe(42);
    });

    test('support custom sdk', async () => {
      await page.goto(`${host}:${port}/${CUSTOM_PAGE}`);
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.hello');
          return el && el.textContent !== null && el.textContent !== 'bff-hono';
        },
        { timeout: 10000 },
      );
      const text = await page.$eval('.hello', el => el?.textContent);
      expect(text).toBe('Hello Custom SDK');
    });

    test('support uoload', async () => {
      await page.goto(`${host}:${port}/${UPLOAD_PAGE}`);
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.mock_file');
          return el && el.textContent !== null && el.textContent.trim() !== '';
        },
        { timeout: 10000 },
      );
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

  describe('error handling in dev', () => {
    let port = 8080;
    let app: any;
    let page: Page;
    let browser: Browser;

    beforeAll(async () => {
      port = await getPort();
      app = await launchApp(appDir, port, {});
      browser = await puppeteer.launch(launchOptions as any);
      page = await browser.newPage();
    });

    test('should display correct error information for get API', async () => {
      await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
        timeout: 50000,
      });
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.get pre');
          return el?.textContent !== 'null';
        },
        { timeout: 10000 },
      );

      const getErrorText = await page.$eval(
        '.get pre',
        (el?: Element) => el?.textContent,
      );

      expect(getErrorText).toContain('"status": 500');
      expect(getErrorText).toContain('"message"');
    });

    test('should display correct error information for exception API', async () => {
      await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
        timeout: 50000,
      });
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.exception pre');
          return el?.textContent !== 'null';
        },
        { timeout: 10000 },
      );

      const exceptionErrorText = await page.$eval(
        '.exception pre',
        (el?: Element) => el?.textContent,
      );

      expect(exceptionErrorText).toContain('"status": 401');
      expect(exceptionErrorText).toContain('"message"');
    });

    test('should display correct error information for getManaged API', async () => {
      await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
        timeout: 50000,
      });
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.getManaged pre');
          return el?.textContent !== 'null';
        },
        { timeout: 10000 },
      );

      const getManagedErrorText = await page.$eval(
        '.getManaged pre',
        (el?: Element) => el?.textContent,
      );

      expect(getManagedErrorText).toContain('"status": 501');
      expect(getManagedErrorText).toContain('"error"');
    });

    test('should display correct error information for exceptionManaged API', async () => {
      await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
        timeout: 50000,
      });
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.exceptionManaged pre');
          return el?.textContent !== 'null';
        },
        { timeout: 10000 },
      );

      const exceptionManagedErrorText = await page.$eval(
        '.exceptionManaged pre',
        (el?: Element) => el?.textContent,
      );

      expect(exceptionManagedErrorText).toContain('"status": 501');
      expect(exceptionManagedErrorText).toContain('"error"');
    });

    afterAll(async () => {
      await killApp(app);
      await page.close();
      await browser.close();
    });
  });

  describe('error handling in prod', () => {
    let port = 8080;
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

    test('should display correct error information for get API', async () => {
      await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
        timeout: 50000,
      });
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.get pre');
          return el?.textContent !== 'null';
        },
        { timeout: 10000 },
      );

      const getErrorText = await page.$eval(
        '.get pre',
        (el?: Element) => el?.textContent,
      );

      expect(getErrorText).toContain('"status": 500');
      expect(getErrorText).toContain('"message"');
    });

    test('should display correct error information for exception API', async () => {
      await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
        timeout: 50000,
      });
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.exception pre');
          return el?.textContent !== 'null';
        },
        { timeout: 10000 },
      );

      const exceptionErrorText = await page.$eval(
        '.exception pre',
        (el?: Element) => el?.textContent,
      );

      expect(exceptionErrorText).toContain('"status": 401');
      expect(exceptionErrorText).toContain('"message"');
    });

    test('should display correct error information for getManaged API', async () => {
      await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
        timeout: 50000,
      });
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.getManaged pre');
          return el?.textContent !== 'null';
        },
        { timeout: 10000 },
      );

      const getManagedErrorText = await page.$eval(
        '.getManaged pre',
        (el?: Element) => el?.textContent,
      );

      expect(getManagedErrorText).toContain('"status": 501');
      expect(getManagedErrorText).toContain('"error"');
    });

    test('should display correct error information for exceptionManaged API', async () => {
      await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
        timeout: 50000,
      });
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.exceptionManaged pre');
          return el?.textContent !== 'null';
        },
        { timeout: 10000 },
      );

      const exceptionManagedErrorText = await page.$eval(
        '.exceptionManaged pre',
        (el?: Element) => el?.textContent,
      );

      expect(exceptionManagedErrorText).toContain('"status": 501');
      expect(exceptionManagedErrorText).toContain('"error"');
    });

    afterAll(async () => {
      await killApp(app);
      await page.close();
      await browser.close();
    });
  });
});
