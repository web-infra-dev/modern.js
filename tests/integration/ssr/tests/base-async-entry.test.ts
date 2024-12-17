import dns from 'node:dns';
import path, { join } from 'path';
import { fs } from '@modern-js/utils';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

dns.setDefaultResultOrder('ipv4first');

jest.setTimeout(1000 * 20);

describe('init with SSR', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;
  let appDir: string;

  beforeAll(async () => {
    appDir = join(fixtureDir, 'base-async-entry');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);

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

  test('should get assets correctly', async () => {
    page.setJavaScriptEnabled(false);
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'load',
    });
    const scriptAry = await page.$$eval('body > script', scripts =>
      scripts
        .filter(script => script.src && script.type !== 'application/json')
        .map(script => {
          return new URL(script.src).pathname;
        }),
    );
    const cssAry = await page.$$eval('head > link', links =>
      links
        .filter(link => link.rel === 'stylesheet')
        .map(link => {
          return new URL(link.href).pathname;
        }),
    );

    const loadableStats = fs.readJSONSync(
      path.join(appDir, 'dist/loadable-stats.json'),
    );
    const chunks = loadableStats.namedChunkGroups['async-main'].assets;
    const urls: string[] = chunks.map((chunk: { name: string }) => {
      return `/${chunk.name}`;
    });
    const existAssets = loadableStats.entrypoints.main.assets.map(
      (asset: { name: string }) => `/${asset.name}`,
    );

    const allInHTML = urls.every(
      url =>
        existAssets.includes(url) ||
        scriptAry.includes(url) ||
        cssAry.includes(url),
    );
    expect(allInHTML).toBeTruthy();
  });
});
