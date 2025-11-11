import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';

const projectDir = path.resolve(__dirname, '..');

describe('router-ssr-i18n', () => {
  let app: unknown;
  let page: Page;
  let browser: Browser;
  let appPort: number;
  beforeAll(async () => {
    const appDir = projectDir;
    appPort = await getPort();
    app = await launchApp(appDir, appPort);

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    // Set default Accept-Language to English to avoid unexpected redirects
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });
  });

  beforeEach(async () => {
    // Clear cookies before each test to ensure clean state
    const cookies = await page.cookies();
    for (const cookie of cookies) {
      await page.deleteCookie(cookie);
    }
    // Clear localStorage to ensure clean state (only if page is loaded)
    try {
      await page.evaluate(() => {
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }
      });
    } catch (error) {
      // Ignore SecurityError if page is not loaded yet
    }
    // Reset header to English to ensure clean state
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });
  });
  afterAll(async () => {
    if (browser) {
      browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test('redirect-to-en', async () => {
    // Set cookie to en to ensure consistent language detection
    await page.setCookie({
      name: 'i18next',
      value: 'en',
      domain: 'localhost',
      path: '/',
    });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/en`);
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/en`);
    await page.goto(`http://localhost:${appPort}/about`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/en/about`);
    await page.goto(`http://localhost:${appPort}/about/`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/en/about`);
  });

  test('redirect-based-on-cookie', async () => {
    // Set cookie to zh before navigation
    await page.setCookie({
      name: 'i18next',
      value: 'zh',
      domain: 'localhost',
      path: '/',
    });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    // Should redirect to /zh based on cookie
    expect(page.url()).toBe(`http://localhost:${appPort}/zh`);

    // Change cookie to en
    await page.setCookie({
      name: 'i18next',
      value: 'en',
      domain: 'localhost',
      path: '/',
    });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    // Should redirect to /en based on cookie
    expect(page.url()).toBe(`http://localhost:${appPort}/en`);
  });

  test('redirect-based-on-header', async () => {
    // Set Accept-Language header to zh
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9',
    });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    // Should redirect to /zh based on Accept-Language header
    expect(page.url()).toBe(`http://localhost:${appPort}/zh`);

    // Clear localStorage and cookies before changing header
    try {
      await page.evaluate(() => {
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }
      });
    } catch (error) {
      // Ignore SecurityError if page is not loaded yet
    }
    const cookies = await page.cookies();
    for (const cookie of cookies) {
      await page.deleteCookie(cookie);
    }

    // Change header to en
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    // Should redirect to /en based on Accept-Language header
    expect(page.url()).toBe(`http://localhost:${appPort}/en`);
  });

  test('redirect-priority-cookie-over-header', async () => {
    // Set both cookie and header, cookie should have higher priority
    await page.setCookie({
      name: 'i18next',
      value: 'zh',
      domain: 'localhost',
      path: '/',
    });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    // Cookie should take priority over header
    expect(page.url()).toBe(`http://localhost:${appPort}/zh`);
  });
  test('page-zh', async () => {
    const response = await page.goto(`http://localhost:${appPort}/zh`, {
      waitUntil: ['networkidle0'],
    });
    if (process.env.LOCAL_TEST === 'true') {
      const body = await response?.text();
      expect(body).toContain('你好，世界');
    }
    const text = await page.$('#key');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('你好，世界');
  });
  test('page-en', async () => {
    const response = await page.goto(`http://localhost:${appPort}/en`, {
      waitUntil: ['networkidle0'],
    });
    if (process.env.LOCAL_TEST === 'true') {
      const body = await response?.text();
      expect(body).toContain('Hello World');
    }
    const text = await page.$('#key');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('Hello World');
  });
  test('page-zh-about', async () => {
    const response = await page.goto(`http://localhost:${appPort}/zh/about`, {
      waitUntil: ['networkidle0'],
    });
    if (process.env.LOCAL_TEST === 'true') {
      const body = await response?.text();
      expect(body).toContain('关于');
    }
    const text = await page.$('#about');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('关于');
    await page.click('#en-button');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.waitForFunction(
      () => {
        const el = document.querySelector('#about');
        return el && el.textContent !== null && el.textContent === 'About';
      },
      { timeout: 10000 },
    );
  });
  test('page-en-about', async () => {
    const response = await page.goto(`http://localhost:${appPort}/en/about`, {
      waitUntil: ['networkidle0'],
    });
    if (process.env.LOCAL_TEST === 'true') {
      const body = await response?.text();
      expect(body).toContain('About');
    }
    const text = await page.$('#about');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('About');
    await page.click('#zh-button');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.waitForFunction(
      () => {
        const el = document.querySelector('#about');
        return el && el.textContent !== null && el.textContent === '关于';
      },
      { timeout: 10000 },
    );
  });
});
