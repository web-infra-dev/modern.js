import path, { join } from 'path';
import { Page, Browser } from 'puppeteer';
import { launchApp, getPort, killApp } from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

describe('I18n doc render', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'plugin');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);
    page = await (global as any).__BROWSER_GLOBAL__.newPage();
  });

  afterAll(async () => {
    if (browser) {
      browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  it('Should add routes', async () => {
    await page.goto(`http://localhost:${appPort}/filepath-route`, {
      waitUntil: ['networkidle0'],
    });

    let h1 = await page.$('h1');
    let text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('Demo1');

    await page.goto(`http://localhost:${appPort}/content-route`, {
      waitUntil: ['networkidle0'],
    });

    h1 = await page.$('h1');
    text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('Demo2');
  });
});
