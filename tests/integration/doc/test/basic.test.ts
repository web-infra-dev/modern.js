import path, { join } from 'path';
import type { Page, Browser } from 'puppeteer';
import puppeteer from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

describe('Check basic render in development', () => {
  let app: any;
  let page: Page;
  let browser: Browser;
  let appPort: number;
  beforeAll(async () => {
    const appDir = join(fixtureDir, 'basic');
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
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    const h1 = await page.$('h1');
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('Hello World');
    // expect the .header-anchor to be rendered and take the correct href
    const headerAnchor = await page.$('.header-anchor');
    const href = await page.evaluate(
      headerAnchor => headerAnchor?.getAttribute('href'),
      headerAnchor,
    );
    expect(href).toBe('#hello-world');
  });

  it('Guide page', async () => {
    await page.goto(`http://localhost:${appPort}/guide`, {
      waitUntil: ['networkidle0'],
    });
    const h1 = await page.$('h1');
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    expect(text).toContain('Guide');
  });

  it('404 page', async () => {
    await page.goto(`http://localhost:${appPort}/404`, {
      waitUntil: ['networkidle0'],
    });
    // find the 404 text in the page
    const text = await page.evaluate(() => document.body.textContent);
    expect(text).toContain('404');
  });

  it('dark mode', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    const darkModeButton = await page.$('.modern-nav-appearance');
    const html = await page.$('html');
    let htmlClass = await page.evaluate(
      html => html?.getAttribute('class'),
      html,
    );
    const defaultMode = htmlClass?.includes('dark') ? 'dark' : 'light';
    await darkModeButton?.click();
    // check the class in html
    htmlClass = await page.evaluate(html => html?.getAttribute('class'), html);
    expect(htmlClass?.includes('dark')).toBe(defaultMode !== 'dark');
    // click the button again, check the class in html
    await darkModeButton?.click();
    htmlClass = await page.evaluate(html => html?.getAttribute('class'), html);
    expect(htmlClass?.includes('dark')).toBe(defaultMode === 'dark');
  });
});
