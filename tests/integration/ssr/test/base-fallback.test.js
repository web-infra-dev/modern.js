const dns = require('node:dns');
const { join } = require('path');
const path = require('path');
const puppeteer = require('puppeteer');
const {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} = require('../../../utils/modernTestUtils');

dns.setDefaultResultOrder('ipv4first');
const fixtureDir = path.resolve(__dirname, '../fixtures');

async function basicUsage(page, appPort) {
  await page.setExtraHTTPHeaders({
    'x-modern-ssr-fallback': '1',
  });
  const response = await page.goto(`http://localhost:${appPort}`, {
    waitUntil: ['networkidle0'],
  });
  const text = await response.text();
  expect(text).toMatch('<!--<?- html ?>-->');
}

describe('Traditional SSR', () => {
  let app,
    appPort,
    /** @type {puppeteer.Page} */
    page,
    /** @type {puppeteer.Browser} */
    browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'fallback');
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
});

describe('Traditional SSR with rspack', () => {
  let app,
    appPort,
    /** @type {puppeteer.Page} */
    page,
    /** @type {puppeteer.Browser} */
    browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'fallback');
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, { BUNDLER: 'rspack' });

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
});
