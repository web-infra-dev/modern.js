import path, { join } from 'path';
import puppeteer, { Page, Browser } from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

async function basicUsage(page: Page, appPort: number) {
  await page.goto(`http://localhost:${appPort}/user/1`, {
    waitUntil: ['networkidle0'],
  });
  await (expect(page) as any).toMatchTextContent('user1-18');
}

async function errorThrown(page: Page, appPort: number) {
  await page.goto(`http://localhost:${appPort}/error`, {
    waitUntil: ['networkidle0'],
  });

  await (expect(page) as any).toMatchTextContent(/error occurs/);
}

async function errorThrownInClientNavigation(page: Page, appPort: number) {
  await page.goto(`http://localhost:${appPort}`, {
    waitUntil: ['networkidle0'],
  });

  await page.click('#error-btn');
  await (expect(page) as any).toMatchTextContent(
    /{"status":500,"statusText":"Internal Server Error","internal":false,"data":"Error: error occurs"}/,
  );
}

async function redirectInLoader(page: Page, appPort: number) {
  const res = await page.goto(`http://localhost:${appPort}/redirect`, {
    waitUntil: ['networkidle0'],
  });

  const body = await res!.text();
  expect(body).toMatch(/Root layout/);
  expect(body).not.toMatch(/Redirect page/);
}

describe('Traditional SSR in json data with webpack', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'base-json');
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

  test(`basic usage`, async () => {
    await basicUsage(page, appPort);
  });

  test('error thrown in loader', async () => {
    await errorThrown(page, appPort);
  });

  test('error thrown in client navigation', async () => {
    await errorThrownInClientNavigation(page, appPort);
  });

  test('redirect in loader', async () => {
    await redirectInLoader(page, appPort);
  });
});

describe('Traditional SSR in json data with rspack', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'base-json');
    appPort = await getPort();
    app = await launchApp(
      appDir,
      appPort,
      {},
      {
        BUNDLER: 'rspack',
      },
    );

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

  test(`basic usage`, async () => {
    await basicUsage(page, appPort);
  });

  test('error thrown in loader', async () => {
    await errorThrown(page, appPort);
  });

  test('error thrown in client navigation', async () => {
    await errorThrownInClientNavigation(page, appPort);
  });

  test('redirect in loader', async () => {
    await redirectInLoader(page, appPort);
  });
});
