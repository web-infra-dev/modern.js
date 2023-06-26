import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('custom render', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });
  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });

  it(`should add custom div correctly`, async () => {
    await page.goto(`http://localhost:${appPort}/test`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('#csr');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('Custom Render');
  });
});
