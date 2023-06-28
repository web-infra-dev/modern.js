import path, { join } from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

describe('Check functions when base path exists', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'with-base');
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

  test('Should render sidebar correctly', async () => {
    await page.goto(`http://localhost:${appPort}/base/en/guide/quick-start`, {
      waitUntil: ['networkidle0'],
    });
    // take the sidebar
    const sidebar = await page.$$(
      '.modern-sidebar .modern-scrollbar > nav > section',
    );
    expect(sidebar?.length).toBe(1);
    // get the section
  });

  test('Should goto correct link', async () => {
    await page.goto(`http://localhost:${appPort}/base/en/guide/quick-start`, {
      waitUntil: ['networkidle0'],
    });
    const a = await page.$('.modern-doc a:not(.header-anchor)');
    // extract the href of a tag
    const href = await page.evaluate(a => a?.getAttribute('href'), a);
    expect(href).toBe('/base/en/guide/install.html');
  });
});
