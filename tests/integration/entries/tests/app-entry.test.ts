import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  sleep,
} from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

async function gotoAndReadRootText(page: Page, url: string, text: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await page.goto(url, {
        waitUntil: ['domcontentloaded'],
      });
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      await sleep(1000);
    }
  }
  if (lastError) {
    throw lastError;
  }
  await page.waitForFunction(
    expected =>
      document.querySelector('#root')?.textContent?.includes(expected),
    {},
    text,
  );
  const root = await page.$('#root');
  return page.evaluate(el => el?.textContent, root);
}

describe('app-custom', () => {
  let app: unknown;
  let page: Page;
  let browser: Browser;
  let appPort: number;
  beforeAll(async () => {
    const appDir = path.join(fixtures, 'app-entry');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);

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

  test('main', async () => {
    const targetText = await gotoAndReadRootText(
      page,
      `http://localhost:${appPort}`,
      'index',
    );
    expect(targetText?.trim()).toEqual('index');
  });
  test('about', async () => {
    const targetText = await gotoAndReadRootText(
      page,
      `http://localhost:${appPort}/about`,
      'about init data',
    );
    expect(targetText?.trim()).toEqual('about init data');
  });
});
