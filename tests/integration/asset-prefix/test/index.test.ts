import path from 'path';
import { readFileSync } from 'fs';
import puppeteer from 'puppeteer';
import {
  launchApp,
  killApp,
  getPort,
  launchOptions,
} from '../../../utils/modernTestUtils';

const DEFAULT_DEV_HOST = 'localhost';

const fixtures = path.resolve(__dirname, '../fixtures');

describe('asset prefix', () => {
  it(`should generate assetPrefix correctly when dev.assetPrefix is true`, async () => {
    const appPort = await getPort();
    const appDir = path.resolve(fixtures, 'dev-asset-prefix');

    const app = await launchApp(appDir, appPort);

    const HTML = readFileSync(
      path.join(appDir, 'dist/html/main/index.html'),
      'utf-8',
    );
    expect(
      HTML.includes(`http://${DEFAULT_DEV_HOST}:${appPort}/static/js/`),
    ).toBeTruthy();

    await killApp(app);
  });

  it(`should inject window.__assetPrefix__ global variable`, async () => {
    const appDir = path.resolve(fixtures, 'dev-asset-prefix');
    const appPort = await getPort();
    const app = await launchApp(appDir, appPort);
    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
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

    await killApp(app);
    await page.close();
    await browser.close();
  });
});
