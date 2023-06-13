const { join } = require('path');
const path = require('path');
const puppeteer = require('puppeteer');
const {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} = require('../../../utils/modernTestUtils');

const fixtureDir = path.resolve(__dirname, '../fixtures');

async function basicUsage(page, appPort) {
  await page.goto(`http://localhost:${appPort}/user/1`, {
    waitUntil: ['networkidle0'],
  });
  await expect(page).toMatchTextContent('user1-18');
}

async function errorThrown(page, appPort) {
  await page.goto(`http://localhost:${appPort}/error`, {
    waitUntil: ['networkidle0'],
  });

  await expect(page).toMatchTextContent(/error occurs/);
}

async function errorThrownInClientNavigation(page, appPort) {
  await page.goto(`http://localhost:${appPort}`, {
    waitUntil: ['networkidle0'],
  });

  await page.click('#error-btn');
  await expect(page).toMatchTextContent(
    /{"status":500,"statusText":"Internal Server Error","internal":false,"data":"Error: error occurs"}/,
  );
}

async function redirectInLoader(page, appPort) {
  const res = await page.goto(`http://localhost:${appPort}/redirect`, {
    waitUntil: ['networkidle0'],
  });

  const body = await res.text();
  expect(body).toMatch(/Root layout/);
  expect(body).not.toMatch(/Redirect page/);
}

describe('Traditional SSR in json data', () => {
  let app,
    appPort,
    /** @type {puppeteer.Page} */
    page,
    /** @type {puppeteer.Browser} */
    browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'base-json');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);

    browser = await puppeteer.launch(launchOptions);
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

  it(`basic usage`, async () => {
    await basicUsage(page, appPort);
  });

  it('error thrown in loader', async () => {
    await errorThrown(page, appPort);
  });

  it('error thrown in client navigation', async () => {
    await errorThrownInClientNavigation(page, appPort);
  });

  it('redirect in loader', async () => {
    await redirectInLoader(page, appPort);
  });
});

describe('Traditional SSR in json data with rspack', () => {
  let app,
    appPort,
    /** @type {puppeteer.Page} */
    page,
    /** @type {puppeteer.Browser} */
    browser;

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

    browser = await puppeteer.launch(launchOptions);
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

  it(`basic usage`, async () => {
    await basicUsage(page, appPort);
  });

  it('error thrown in loader', async () => {
    await errorThrown(page, appPort);
  });

  it('error thrown in client navigation', async () => {
    await errorThrownInClientNavigation(page, appPort);
  });

  it('redirect in loader', async () => {
    await redirectInLoader(page, appPort);
  });
});
