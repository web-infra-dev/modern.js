import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';
import { gotoWithSSRRetry } from '../../test-utils';

const projectDir = path.resolve(__dirname, '..');

describe('i18n-custom-i18n-wrapper-ssr', () => {
  let app: Awaited<ReturnType<typeof launchApp>>;
  let page: Page;
  let browser: Browser;
  let appPort: number;

  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(projectDir, appPort);
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test('detects wrapper language from SSR request', async () => {
    const html = await gotoWithSSRRetry(
      page,
      `http://localhost:${appPort}/?lng=zh`,
    );

    expect(html).toBeDefined();
    expect(html).toContain('Current Language: <!-- -->zh');
    expect(html).toContain('i18nData');
    expect(html).toContain('"lng":"zh"');
    expect(page.url()).toBe(`http://localhost:${appPort}/zh?lng=zh`);
  });
});
