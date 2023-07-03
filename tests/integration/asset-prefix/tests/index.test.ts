import path from 'path';
import { readFileSync } from 'fs';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
  launchApp,
  killApp,
  getPort,
  launchOptions,
} from '../../../utils/modernTestUtils';

const DEFAULT_DEV_HOST = 'localhost';

const appDir = path.resolve(__dirname, '../');

describe('asset prefix', () => {
  let app: any;
  let appPort: number;
  let errors;
  let browser: Browser;
  let page: Page;
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
    errors = [];
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    page.on('pageerror', error => {
      errors.push(error.message);
    });
  });
  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
  test(`should generate assetPrefix correctly when dev.assetPrefix is true`, async () => {
    const HTML = readFileSync(
      path.join(appDir, 'dist/html/main/index.html'),
      'utf-8',
    );
    expect(
      HTML.includes(`http://${DEFAULT_DEV_HOST}:${appPort}/static/js/`),
    ).toBeTruthy();
  });

  test(`should inject window.__assetPrefix__ global variable`, async () => {
    const expected = `http://${DEFAULT_DEV_HOST}:${appPort}`;

    const mainJs = readFileSync(
      path.join(appDir, 'dist/static/js/main.js'),
      'utf-8',
    );

    expect(
      mainJs.includes(`window.__assetPrefix__ = '${expected}';`),
    ).toBeTruthy();

    await page.goto(`${expected}`);

    const assetPrefix = await page.evaluate(() => {
      // @ts-expect-error
      return window.__assetPrefix__;
    });

    expect(assetPrefix).toEqual(expected);
  });
});
