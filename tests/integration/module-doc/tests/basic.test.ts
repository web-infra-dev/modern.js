import { join } from 'path';
import type { Page, Browser } from 'puppeteer';
import puppeteer from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

describe('Check basic render in development', () => {
  let app: any;
  let page: Page;
  let browser: Browser;
  let appPort: number;
  beforeAll(async () => {
    const appDir = join(__dirname, '..');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
    if (page) {
      await page.close();
    }
    if (browser) {
      browser.close();
    }
  });

  it('Index page', async () => {
    await page.goto(`http://localhost:${appPort}/en/`, {
      waitUntil: ['networkidle0'],
    });
    const h1 = await page.$('h1');
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    expect(text).toContain('Components Overview');
    // expect the .header-anchor to be rendered and take the correct href
    const headerAnchor = await page.$('.header-anchor');
    const href = await page.evaluate(
      headerAnchor => headerAnchor?.getAttribute('href'),
      headerAnchor,
    );
    expect(href).toBe('#components-overview');
  });

  it('404 page', async () => {
    await page.goto(`http://localhost:${appPort}/404`, {
      waitUntil: ['networkidle0'],
    });
    // find the 404 text in the page
    const text = await page.evaluate(() => document.body.textContent);
    expect(text).toContain('404');
  });
});
