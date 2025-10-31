import fs from 'fs';
import path from 'path';
import { isVersionAtLeast18 } from '@modern-js/utils';
import puppeteer from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

function resolveDist(name: string) {
  return path.join(appDir, 'dist', name);
}

function existsSync(filePath: string) {
  return fs.existsSync(resolveDist(filePath));
}

describe.skip('devtools build', () => {
  test(`should get right devtools build!`, async () => {
    if (!isVersionAtLeast18()) return;
    const buildRes = await modernBuild(appDir);
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('route.json')).toBe(true);
    expect(existsSync('html/main/index.html')).toBe(true);

    const pageName = resolveDist('static/js/async/page.js');
    const pageContent = await fs.promises.readFile(pageName, 'utf-8');
    expect(pageContent).toMatch(
      `{"url":"/static/assets/crab.png","width":1920,"height":1281,"thumbnail":`,
    );
  });

  test.skip('should get image url with production CDN', async () => {
    if (!isVersionAtLeast18()) return;
    const appPort = await getPort();
    const app = await modernServe(appDir, appPort);
    const errors: string[] = [];

    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('#root img');
    const targetText = await page.evaluate(el => el?.outerHTML, root);
    expect(targetText).toMatchInlineSnapshot(
      `"<img src="/static/assets/crab.png?w=1000&amp;q=75" alt="test" width="500" height="333.59375" srcset="/static/assets/crab.png?w=500&amp;q=75 1x,/static/assets/crab.png?w=1000&amp;q=75 2x" loading="lazy" style="">"`,
    );
    expect(errors.length).toEqual(0);

    await browser.close();
    await killApp(app);
  });
});

describe.skip('devtools dev', () => {
  test(`should render page correctly`, async () => {
    if (!isVersionAtLeast18()) return;
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
    const errors: string[] = [];

    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('#root img');
    const targetText = await page.evaluate(el => el?.outerHTML, root);
    expect(targetText).toMatchInlineSnapshot(
      `"<img src="/_modern/ipx/f_auto,w_1000,q_75/static/assets/crab.png" alt="test" width="500" height="333.59375" srcset="/_modern/ipx/f_auto,w_500,q_75/static/assets/crab.png 1x,/_modern/ipx/f_auto,w_1000,q_75/static/assets/crab.png 2x" loading="lazy" style="">"`,
    );
    expect(errors.length).toEqual(0);

    await browser.close();
    await killApp(app);
  });
});
