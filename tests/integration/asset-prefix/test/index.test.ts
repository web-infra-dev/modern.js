import path from 'path';
import { readFileSync } from 'fs';
import { Page } from 'puppeteer';
import { DEFAULT_DEV_HOST } from '@modern-js/utils';
import { launchApp, killApp } from '../../../utils/modernTestUtils';

declare const page: Page;

const fixtures = path.resolve(__dirname, '../fixtures');

describe('asset prefix', () => {
  it(`should generate assetPrefix correctly when dev.assetPrefix is true`, async () => {
    const appDir = path.resolve(fixtures, 'dev-asset-prefix');

    const app = await launchApp(appDir);

    const HTML = readFileSync(
      path.join(appDir, 'dist/html/main/index.html'),
      'utf-8',
    );
    expect(HTML.includes(`//${DEFAULT_DEV_HOST}:3333/static/js/`)).toBeTruthy();

    killApp(app);
  });

  it(`should inject window.__assetPrefix__ global variable`, async () => {
    const appDir = path.resolve(fixtures, 'dev-asset-prefix');

    const app = await launchApp(appDir);
    const expected = `//${DEFAULT_DEV_HOST}:3333`;

    const mainJs = readFileSync(
      path.join(appDir, 'dist/static/js/main.js'),
      'utf-8',
    );

    expect(
      mainJs.includes(`window.__assetPrefix__ = '${expected}';`),
    ).toBeTruthy();

    await page.goto(`http:${expected}`);

    const assetPrefix = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return window.__assetPrefix__;
    });

    expect(assetPrefix).toEqual(expected);

    killApp(app);
  });
});
