import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import {
  launchApp,
  killApp,
  getPort,
  launchOptions,
  modernBuild,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

function existsSync(filePath: string) {
  return fs.existsSync(path.join(appDir, 'dist', filePath));
}

describe.skip('devtools build', () => {
  test(`should get right devtools build!`, async () => {
    const buildRes = await modernBuild(appDir);
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('route.json')).toBe(true);
    expect(existsSync('html/main/index.html')).toBe(true);
  });
});

describe.skip('devtools dev', () => {
  test(`should render page correctly`, async () => {
    const appPort = await getPort();
    const app = await launchApp(
      appDir,
      appPort,
      {},
      {
        // FIXME: disable the fast refresh plugin to avoid the `require` not found issue.
        FAST_REFRESH: 'false',
      },
    );
    const errors = [];

    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('Hello Modern.js!');
    expect(errors.length).toEqual(0);

    await browser.close();
    await killApp(app);
  });
});
