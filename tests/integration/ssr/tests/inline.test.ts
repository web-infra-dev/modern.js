import dns from 'node:dns';
import path, { join } from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

dns.setDefaultResultOrder('ipv4first');

describe.skip('Inline SSR', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'inline');
    appPort = await getPort();

    await modernBuild(appDir);
    app = await modernServe(appDir, appPort);

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  test('should inline style & js', async () => {
    await page.goto(`http://localhost:${appPort}`);

    const content = await page.content();

    expect(content).toMatch('.card:hover');

    expect(content).toMatch('t.jsx)("code",');
  });

  afterAll(async () => {
    if (browser) {
      browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });
});
