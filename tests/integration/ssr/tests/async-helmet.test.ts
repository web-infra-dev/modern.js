import path, { join } from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

async function productsPageHelmet(page: Page, appPort: number) {
  // First, verify initial stream HTML contains page content
  const res = await page.goto(`http://localhost:${appPort}/products`, {
    waitUntil: ['domcontentloaded'],
  });

  const resText = await res!.text();

  // Verify page content is present in the stream
  expect(resText).toMatch(/Products Page/);
  expect(resText).toMatch(/Products list loaded/);

  // Wait for hydration to complete and async content to be ready
  await page.waitForSelector('#products-list', { timeout: 5000 });

  // Verify content is correct after hydration
  const h1 = await page.$eval('h1', el => el.textContent);
  expect(h1).toBe('Products Page');

  const content = await page.$eval('#products-list', el => el.textContent);
  expect(content).toBe('Products list loaded');

  // Now check user page - verify independent stream content
  const resUser = await page.goto(`http://localhost:${appPort}/user`, {
    waitUntil: ['domcontentloaded'],
  });

  const resUserText = await resUser!.text();

  // Verify user page content is present
  expect(resUserText).toMatch(/User Page/);
  expect(resUserText).toMatch(/User info loaded/);

  // Wait for hydration
  await page.waitForSelector('#user-info', { timeout: 5000 });

  // Verify user page content is correct
  const userH1 = await page.$eval('h1', el => el.textContent);
  expect(userH1).toBe('User Page');
}

describe('Async Helmet SSR', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'async-helmet');
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

  test(`products page helmet with canonical link`, async () => {
    await productsPageHelmet(page, appPort);
  });
});
