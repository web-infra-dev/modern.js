import path, { join } from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

describe('Streaming SSR with ssr.inlineScript', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'streaming-inline');
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {});

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

  test('window._SSR_DATA is json', async () => {
    const res = await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const body = await res!.text();
    expect(body).toMatch(
      /<script type="application\/json" id="__MODERN_SSR_DATA__">/,
    );
  });
});
