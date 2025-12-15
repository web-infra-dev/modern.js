import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('dev', () => {
  let app: unknown;
  let appPort: number;
  let page: Page;
  let browser: Browser;
  const errors: string[] = [];
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    page.on('pageerror', error => {
      errors.push((error as Error).message);
    });
  });

  test('should return response header set in before correctly', async () => {
    const response = await page.goto(`http://localhost:${appPort}`);
    const headers = response!.headers();
    expect(headers['x-config']).toBe('test-config');
    expect(headers['x-plugin']).toBe('test-plugin');
    expect(headers['x-push-middleware']).toBe('test-middleware');
    expect(headers['x-unshift-middleware']).toBe('test-middleware');
  });

  test('should provide history api fallback correctly', async () => {
    await page.goto(`http://localhost:${appPort}`);
    expect(await page.content()).toContain('<div>home<div>');

    await page.goto(`http://localhost:${appPort}/a`);
    expect(await page.content()).toContain('<div>A</div>');

    await page.goto(`http://localhost:${appPort}/b`);
    expect(await page.content()).toContain('<div>B</div>');
  });

  test('should return correct CORS headers for OPTIONS request', async () => {
    // Create a new browser context to simulate cross-origin request
    const context = await browser.createBrowserContext();
    const corsPage = await context.newPage();

    // Set the origin header to simulate cross-origin request
    await corsPage.setExtraHTTPHeaders({
      Origin: 'http://example.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    });

    const response = await corsPage.evaluate(url => {
      // Use Promise instead of async/await to avoid __awaiter issues
      return fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      }).then(res => {
        const headers: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          headers[key] = value;
        });

        return {
          status: res.status,
          headers,
        };
      });
    }, `http://localhost:${appPort}`);

    // Check CORS preflight headers
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://example.com',
    );
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-headers']).toContain(
      'Content-Type',
    );

    await corsPage.close();
    await context.close();
  });

  test('should not return access-control-allow-origin header for OPTIONS request', async () => {
    // Create a new browser context to simulate cross-origin request
    const context = await browser.createBrowserContext();
    const corsPage = await context.newPage();

    // Set the origin header to simulate cross-origin request
    await corsPage.setExtraHTTPHeaders({
      Origin: 'http://modernjs.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    });

    const response = await corsPage.evaluate(url => {
      // Use Promise instead of async/await to avoid __awaiter issues
      return fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://modernjs.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      }).then(res => {
        const headers: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          headers[key] = value;
        });

        return {
          status: res.status,
          headers,
        };
      });
    }, `http://localhost:${appPort}`);

    // Check CORS preflight headers
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.headers['access-control-allow-methods']).toContain('POST');

    await corsPage.close();
    await context.close();
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});
