import { readFileSync } from 'fs';
import path from 'path';
import { afterAll, beforeAll, describe, expect, test } from '@rstest/core';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const DEFAULT_DEV_HOST = 'localhost';
const appDir = path.resolve(__dirname, '../');

describe('asset prefix', () => {
  let app: unknown;
  let appPort: number;
  const errors: string[] = [];
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    page.on('pageerror', error => {
      errors.push((error as Error).message);
    });
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });

  test('should generate assetPrefix correctly when dev.assetPrefix is true', async () => {
    const html = readFileSync(
      path.join(appDir, 'dist/html/index/index.html'),
      'utf-8',
    );

    expect(
      html.includes(`http://${DEFAULT_DEV_HOST}:${appPort}/static/js/`),
    ).toBeTruthy();
    expect(errors).toEqual([]);
  });

  test('should inject window.__assetPrefix__ global variable', async () => {
    const expected = `http://${DEFAULT_DEV_HOST}:${appPort}`;
    const mainJs = readFileSync(
      path.join(appDir, 'dist/static/js/index.js'),
      'utf-8',
    );

    expect(
      mainJs.includes(`window.__assetPrefix__ = '${expected}';`),
    ).toBeTruthy();

    await page.goto(expected, {
      waitUntil: ['networkidle0'],
    });

    const assetPrefix = await page.evaluate(() => {
      // @ts-expect-error test-only global from the page runtime.
      return window.__assetPrefix__;
    });

    expect(assetPrefix).toEqual(expected);
    expect(errors).toEqual([]);
  });

  test('should access the file which create by writeFile correctly', async () => {
    const url = `http://${DEFAULT_DEV_HOST}:${appPort}/static/test.js`;
    const response = await page.goto(url, {
      waitUntil: ['networkidle0'],
      timeout: 50_000,
    });
    const content = await response?.text();

    expect(content).toMatch('console.log("test")');
    expect(errors).toEqual([]);
  });
});
