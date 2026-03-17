import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';
import {
  conditionalTest,
  gotoWithSSRRetry,
  waitForHydration,
} from '../../test-utils';

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
  conditionalTest('page-zh', async () => {
    const body = await gotoWithSSRRetry(page, `http://localhost:${appPort}/zh`);
    if (process.env.LOCAL_TEST === 'true') {
      expect(body).toContain('你好，世界');
    }
    const text = await page.$('#key');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('你好，世界');
  });
  conditionalTest('page-en', async () => {
    const body = await gotoWithSSRRetry(page, `http://localhost:${appPort}/en`);
    if (process.env.LOCAL_TEST === 'true') {
      expect(body).toContain('Hello World');
    }
    const text = await page.$('#key');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('Hello World');
  });
  conditionalTest('page-zh-about', async () => {
    const body = await gotoWithSSRRetry(
      page,
      `http://localhost:${appPort}/zh/about`,
    );
    if (process.env.LOCAL_TEST === 'true') {
      expect(body).toContain('关于');
    }
    const text = await page.$('#about');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('关于');
    // Wait for React hydration so button click handlers are attached
    await waitForHydration(page, '#en-button');
    await page.click('#en-button');
    await page.waitForFunction(
      () => {
        const el = document.querySelector('#about');
        return el && el.textContent !== null && el.textContent === 'About';
      },
      { timeout: 30000 },
    );
  });
  conditionalTest('page-en-about', async () => {
    const body = await gotoWithSSRRetry(
      page,
      `http://localhost:${appPort}/en/about`,
    );
    if (process.env.LOCAL_TEST === 'true') {
      expect(body).toContain('About');
    }
    const text = await page.$('#about');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('About');
    // Wait for React hydration so button click handlers are attached
    await waitForHydration(page, '#zh-button');
    await page.click('#zh-button');
    await page.waitForFunction(
      () => {
        const el = document.querySelector('#about');
        return el && el.textContent !== null && el.textContent === '关于';
      },
      { timeout: 30000 },
    );
  });
});
