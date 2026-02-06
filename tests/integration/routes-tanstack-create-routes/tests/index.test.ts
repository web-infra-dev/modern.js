import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('routes-tanstack-create-routes', () => {
  let appPort: number;
  let app: unknown;
  let browser: Browser;
  let page: Page;
  const errors: string[] = [];

  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 5);
    await modernBuild(appDir);
    appPort = await getPort();
    app = await modernServe(appDir, appPort);
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test('supports createRoutes + modifyRoutes + onBeforeCreateRoutes', async () => {
    const modifiedRes = await fetch(`http://localhost:${appPort}/modified`, {
      headers: {
        Accept: 'text/html',
      },
    });
    expect(modifiedRes.status).toBe(200);
    expect(modifiedRes.headers.get('x-tanstack-before-create-routes')).toBe('1');
    const html = await modifiedRes.text();
    expect(html).toContain('modified:');
    expect(html).toContain('hooked');

    const originalRes = await fetch(`http://localhost:${appPort}/original`, {
      redirect: 'manual',
    });
    expect(originalRes.status).toBe(404);
  });

  test('navigates to rewritten route in browser', async () => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: ['networkidle0'],
    });
    await page.waitForSelector('[data-testid="link-modified"]');
    await Promise.all([
      page.click('[data-testid="link-modified"]'),
      page.waitForSelector('#page'),
    ]);

    const pageText = await page.$eval('#page', el => el.textContent);
    expect(pageText).toBe('modified:missing');
    const unexpectedErrors = errors.filter(
      message =>
        message !==
        'Failed to load resource: the server responded with a status of 404 (Not Found)',
    );
    expect(unexpectedErrors).toEqual([]);
  });
});
