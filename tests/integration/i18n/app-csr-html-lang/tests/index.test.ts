import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';

const projectDir = path.resolve(__dirname, '..');

describe('app-csr-html-lang', () => {
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
  });

  afterAll(async () => {
    if (browser) {
      browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test('should update html lang attribute when language changes', async () => {
    // Check initial load (fallback or detected)
    await page.goto(`http://localhost:${appPort}/lang/en`);
    await page.waitForSelector('#root');
    const langEn = await page.evaluate(() =>
      document.documentElement.getAttribute('lang'),
    );
    expect(langEn).toBe('en');

    // Change to zh
    await page.goto(`http://localhost:${appPort}/lang/zh`);
    await page.waitForSelector('#root');
    const langZh = await page.evaluate(() =>
      document.documentElement.getAttribute('lang'),
    );
    expect(langZh).toBe('zh');
  });
});
