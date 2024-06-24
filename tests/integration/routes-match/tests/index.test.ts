import dns from 'node:dns';
import path from 'path';
import puppeteer, { Page, Browser } from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

dns.setDefaultResultOrder('ipv4first');

const appDir = path.resolve(__dirname, '../');

describe('map routes match', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {});

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

  test('should match route correctly', async () => {
    const res1 = await page.goto(`http://localhost:${appPort}/detail/123`);
    const text1 = await res1.text();

    expect(text1).toMatch('AAA');

    const res2 = await page.goto(`http://localhost:${appPort}/detail/1`);
    const text2 = await res2.text();

    expect(text2).toMatch('BBB');

    const res3 = await page.goto(`http://localhost:${appPort}/detail/12`);
    const text3 = await res3.text();

    expect(text3).toMatch('CCC');
  });
});
