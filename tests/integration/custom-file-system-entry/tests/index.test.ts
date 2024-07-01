import path from 'path';
import puppeteer, { Browser } from 'puppeteer';

import type { Page } from 'puppeteer';
import {
  launchApp,
  killApp,
  getPort,
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
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
      interceptedRequest.continue();
    });
    page.on('pageerror', error => {
      console.log(error.message);
      errors.push(error.message);
    });
  });

  test('should render correctly', async () => {
    await page.goto(`http://localhost:${appPort}/custom`, {
      waitUntil: ['networkidle0'],
    });
    const element = await page.$('.index');
    const targetText = await page.evaluate(
      el => el?.firstChild?.textContent,
      element,
    );
    expect(targetText?.includes('custom entry'));
  });
  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});
