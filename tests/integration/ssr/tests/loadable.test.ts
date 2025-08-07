import path, { join } from 'path';
import { fs } from '@modern-js/utils';
import axios from 'axios';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

async function loadableUsage(page: Page, appPort: number) {
  await page.goto(`http://localhost:${appPort}`, {
    waitUntil: ['networkidle0'],
  });
  await (expect(page) as any).toMatchTextContent('Hello, Loadable Component!');
}

describe('loadable', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'loadable');
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

  test('should have correct content in loadable-stats.json', async () => {
    const appDir = join(fixtureDir, 'loadable');
    const loadableStatsFile = join(appDir, 'dist', 'loadable-stats.json');
    const stats = JSON.parse(fs.readFileSync(loadableStatsFile, 'utf-8'));
    expect(stats.assetsByChunkName['components-MyComponent']).toEqual([
      'static/js/async/components-MyComponent.js',
    ]);
  });

  test('should have Hello, Loadable Component! in html', async () => {
    const { data: html } = await axios.get(`http://localhost:${appPort}`);
    expect(html).toMatch('Hello, Loadable Component!');
  });

  test(`basic usage`, async () => {
    await loadableUsage(page, appPort);
  });
});
